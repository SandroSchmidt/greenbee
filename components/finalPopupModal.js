/* ========================================================================== */
/* ------------------------- FINAL RESULTS MODAL ---------------------------- */
/* ========================================================================== */

const FRM_GROUP_COLORS = ['#3B82F6', '#F97316', '#10B981']; // youth, families, seniors

function showFinalResultsModal(gameState, worldSettings, simulationResult, options = {}) {
  injectFinalResultsStyles();
  const m = computeFinalMetrics(gameState, worldSettings, simulationResult);

  const backdrop = document.createElement('div');
  backdrop.className = 'frm-backdrop';
  backdrop.innerHTML = buildModalHTML(m, options.leaderboard);

  // Heatmap cells need to be JS-rendered (intensity per cell)
  const grid = backdrop.querySelector('.frm-heatmap');
  if (grid) {
    grid.style.gridTemplateColumns = `repeat(${m.gridSize}, 1fr)`;
    m.heatmapIntensities.forEach(v => {
      const cell = document.createElement('div');
      cell.className = 'frm-heatmap-cell';
      cell.style.background = heatmapColor(v);
      grid.appendChild(cell);
    });
  }

  // Wire interactions
  const close = () => backdrop.remove();
  backdrop.querySelector('.frm-close').addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  backdrop.querySelector('.frm-restart').addEventListener('click', () => {
    close();
    options.onRestart && options.onRestart();
  });
  const reviewBtn = backdrop.querySelector('.frm-review');
  if (reviewBtn && options.onReview) {
    reviewBtn.addEventListener('click', () => {
      close();
      options.onReview();
    });
  } else if (reviewBtn) {
    reviewBtn.style.display = 'none';
  }

  document.body.appendChild(backdrop);
  return backdrop;
}

/* ------------------- METRICS COMPUTATION (pure) -------------------------- */

function computeFinalMetrics(gameState, worldSettings, simulationResult) {
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const sum = arr => (arr || []).reduce((a, b) => a + num(b), 0);
  const normalize = arr => {
    const copy = Array.isArray(arr) ? arr.map(num).map(v => Math.max(0, v)) : [0, 0, 0];
    const total = sum(copy);
    return total > 0 ? copy.map(v => v / total) : copy.map(() => 0);
  };
  const simulation = simulationResult || {};

  const finalBudget    = num(gameState.budget);
  const startingBudget = num(worldSettings.startBudget);
  const budgetDelta    = finalBudget - startingBudget;

  const totalVisitors = sum(gameState.ticketSales);
  const vSat   = (Array.isArray(simulation.visitorsSatisfaction) ? simulation.visitorsSatisfaction : [0, 0, 0]).map(num);
  const avgVS  = vSat.length ? vSat.reduce((a, b) => a + b, 0) / vSat.length : 0;
  const vendor = num(simulation.vendorsSatisfaction);

  const totalObjectIncome = sum(gameState.objectIncomeHistory);
  const totalTicketIncome = sum(gameState.ticketIncomeHistory);

  // Per-vendor breakdown — recompute using the same formula as
  // getVendorsSatisfaction, but keep the per-booth values instead of averaging.
  // Avoids changing your existing function's signature.
  const tileVisits = getVisitCountsByTile(
    Array.isArray(simulation.peopleTracker) ? simulation.peopleTracker : [],
    worldSettings.gridSize,
    worldSettings.gridSize
  );
  const perVendor = (gameState.rentedBooths || []).map(b => {
    const visits = tileVisits[b.tile] || [0, 0, 0];
    const totalAtBooth = visits.reduce((a, b) => a + b, 0);
    const sim = kosinusSimilarity(
      normalize(b.vendorSuitabilityByGroup),
      normalize(visits)
    );
    return {
      name: b.vendorName || b.obj_key || 'Vendor',
      tile: b.tile,
      satisfaction: sim * saturation(totalAtBooth, 2, 200),
    };
  }).sort((a, b) => b.satisfaction - a.satisfaction);

  // Heatmap totals
  const N = worldSettings.gridSize;
  const totals = [];
  let maxTotal = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const tileId = rows_notation[i] + (j + 1);
      const t = (tileVisits[tileId] || [0, 0, 0]).reduce((a, b) => a + b, 0);
      totals.push(t);
      if (t > maxTotal) maxTotal = t;
    }
  }

  // Verdict (simple heuristic — easy to swap for something more nuanced later)
  const profitable = budgetDelta > 0;
  const bestSat = Math.max(...vSat);
  const worstSat = Math.min(...vSat);
  const balanced = bestSat > 0 && (worstSat / bestSat) > 0.7;
  let verdict;
  if (profitable && balanced && avgVS > 0.6)   verdict = 'Profitable, broadly satisfying';
  else if (profitable && !balanced)             verdict = 'Profitable, audience-leaning';
  else if (profitable)                          verdict = 'Profitable, mixed reception';
  else if (avgVS > 0.5)                         verdict = 'Loved by visitors, costly to run';
  else                                          verdict = 'Below break-even';

  return {
    worldName: worldSettings.name,
    turnsPlayed: (gameState.turnReports || []).length || gameState.turn,
    finalBudget, startingBudget, budgetDelta,
    totalVisitors,
    visitorsByGroup: gameState.ticketSales || [0, 0, 0],
    visitorsSatisfaction: vSat,
    avgVisitorSat: avgVS,
    vendorSat: vendor,
    totalObjectIncome, totalTicketIncome,
    totalIncome: totalObjectIncome + totalTicketIncome,
    budgetHistory: gameState.budgetHistory || [],
    perVendor,
    objectsPlaced: Object.keys(gameState.board || {}).length,
    vendorsHired: (gameState.rentedBooths || []).length,
    speakersAppointed: (gameState.appointedSpeakers || []).length,
    marketingChannels: Object.values(gameState.marketingPlan || {}).filter(v => v > 0).length,
    finalTicketPrice: gameState.ticketPrice,
    heatmapIntensities: totals.map(t => maxTotal > 0 ? t / maxTotal : 0),
    gridSize: N,
    groupNames: worldSettings.groups || ['Youth', 'Families', 'Seniors'],
    verdict,
  };
}

/* ------------------- HTML BUILDERS ---------------------------------------- */

function buildModalHTML(m, leaderboard) {
  const fmt = n => '€' + Math.round(n).toLocaleString();
  const pct = v => Math.round(v * 100) + '%';
  const deltaColor = m.budgetDelta >= 0 ? '#10B981' : '#EF4444';
  const deltaSign = m.budgetDelta >= 0 ? '+' : '';

  return `
    <div class="frm-modal" role="dialog" aria-labelledby="frm-title">
      <div class="frm-header">
        <div>
          <div id="frm-title" class="frm-title">Game complete</div>
          <div class="frm-subtitle">${escapeHTML(m.worldName)} · ${m.turnsPlayed} turns played</div>
        </div>
        <button class="frm-close" aria-label="Close">×</button>
      </div>

      <div class="frm-body">
        <div class="frm-hero-grid">
          <div class="frm-hero">
            <div class="frm-hero-label">Final budget</div>
            <div class="frm-hero-value">${fmt(m.finalBudget)}</div>
            <div class="frm-hero-delta" style="color:${deltaColor}">${deltaSign}${fmt(m.budgetDelta).replace('€-','-€').replace('-€-','-€')}</div>
          </div>
          <div class="frm-hero">
            <div class="frm-hero-label">Visitors</div>
            <div class="frm-hero-value">${m.totalVisitors}</div>
            <div class="frm-hero-delta">across ${m.groupNames.length} groups</div>
          </div>
          <div class="frm-hero">
            <div class="frm-hero-label">Visitor satisfaction</div>
            <div class="frm-hero-value">${pct(m.avgVisitorSat)}</div>
            <div class="frm-hero-delta">avg of groups</div>
          </div>
          <div class="frm-hero">
            <div class="frm-hero-label">Vendor satisfaction</div>
            <div class="frm-hero-value">${pct(m.vendorSat)}</div>
            <div class="frm-hero-delta">avg of ${m.vendorsHired} booths</div>
          </div>
        </div>

        <div class="frm-section">
          <div class="frm-section-label">Visitor satisfaction by group</div>
          ${m.groupNames.map((name, i) => `
            <div class="frm-bar-row">
              <span class="frm-bar-name">${escapeHTML(name)}</span>
              <span class="frm-bar-track"><span class="frm-bar-fill" style="width:${pct(m.visitorsSatisfaction[i])}; background:${FRM_GROUP_COLORS[i]}"></span></span>
              <span class="frm-bar-pct">${pct(m.visitorsSatisfaction[i])}</span>
              <span class="frm-bar-meta">${m.visitorsByGroup[i]} visitors</span>
            </div>
          `).join('')}
        </div>

        <div class="frm-split">
          <div class="frm-card">
            <div class="frm-section-label">Budget journey</div>
            <div class="frm-budget-line">
              <span style="color:#666">${fmt(m.startingBudget)}</span>
              <span style="color:#aaa">→</span>
              <span style="font-weight:500">${fmt(m.finalBudget)}</span>
            </div>
            ${buildSparkline(m.budgetHistory)}
          </div>
          <div class="frm-card">
            <div class="frm-section-label">Income breakdown</div>
            <div class="frm-budget-line"><span style="font-weight:500">${fmt(m.totalIncome)}</span><span style="color:#666;font-size:12px">total earned</span></div>
            <div class="frm-stack-bar">
              <div style="width:${m.totalIncome ? (m.totalTicketIncome/m.totalIncome*100) : 0}%; background:#6366F1"></div>
              <div style="width:${m.totalIncome ? (m.totalObjectIncome/m.totalIncome*100) : 0}%; background:#F59E0B"></div>
            </div>
            <div class="frm-stack-row"><span><span class="frm-dot" style="background:#6366F1"></span>Tickets</span><span>${fmt(m.totalTicketIncome)}</span></div>
            <div class="frm-stack-row"><span><span class="frm-dot" style="background:#F59E0B"></span>Objects</span><span>${fmt(m.totalObjectIncome)}</span></div>
          </div>
        </div>

        ${m.perVendor.length ? `
          <div class="frm-section">
            <div class="frm-section-label">Vendor satisfaction</div>
            ${m.perVendor.map(v => `
              <div class="frm-bar-row">
                <span class="frm-bar-name">${escapeHTML(v.name)}</span>
                <span class="frm-bar-track"><span class="frm-bar-fill" style="width:${pct(v.satisfaction)}; background:#111"></span></span>
                <span class="frm-bar-pct">${pct(v.satisfaction)}</span>
                <span class="frm-bar-meta">${v.tile}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${buildLeaderboardSection(leaderboard)}

        <div class="frm-section">
          <div class="frm-section-label">Event composition</div>
          <div class="frm-pills">
            <span class="frm-pill"><b>${m.objectsPlaced}</b> objects</span>
            <span class="frm-pill"><b>${m.vendorsHired}</b> vendors</span>
            <span class="frm-pill"><b>${m.speakersAppointed}</b> speakers</span>
            <span class="frm-pill"><b>${m.marketingChannels}</b> marketing channels</span>
            <span class="frm-pill">final price <b>${fmt(m.finalTicketPrice)}</b></span>
          </div>
        </div>

        <div class="frm-section">
          <div class="frm-section-label">Visitor flow</div>
          <div class="frm-flow-row">
            <div class="frm-heatmap"></div>
            <div class="frm-flow-legend">
              <div style="margin-bottom:8px">Cells colored by total visits across all groups.</div>
              <div class="frm-legend-row"><span>less</span>
                <span class="frm-legend-stops">
                  <span style="background:#F1EFE8"></span>
                  <span style="background:#D3D1C7"></span>
                  <span style="background:#888780"></span>
                  <span style="background:#444441"></span>
                  <span style="background:#2C2C2A"></span>
                </span>
                <span>more</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="frm-footer">
        <div class="frm-verdict">Verdict <b>${escapeHTML(m.verdict)}</b></div>
        <div style="display:flex;gap:8px">
          <button class="frm-review">Review report</button>
          <button class="frm-restart">Restart game →</button>
        </div>
      </div>
    </div>`;
}

/* ----- Leaderboard section: self-contained, returns '' when omitted ------ */

function buildLeaderboardSection(lb) {
  if (!lb || !lb.metrics || !lb.metrics.length) return '';
  return `
    <div class="frm-section frm-leaderboard">
      <div class="frm-section-label">How you compare · ${lb.totalPlayers} players in this world</div>
      ${lb.metrics.map(row => `
        <div class="frm-bar-row">
          <span class="frm-bar-name">${escapeHTML(row.label)}</span>
          <span class="frm-bar-track"><span class="frm-bar-fill" style="width:${Math.round(row.percentile)}%; background:#111"></span></span>
          <span class="frm-bar-pct">#${row.rank}</span>
          <span class="frm-bar-meta">top ${100 - Math.round(row.percentile)}%</span>
        </div>
      `).join('')}
    </div>`;
}

/* ------------------- LITTLE HELPERS --------------------------------------- */

function buildSparkline(history) {
  if (!history.length) return '<div style="height:60px"></div>';
  const w = 240, h = 60, pad = 4;
  const min = Math.min(...history), max = Math.max(...history);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(1, history.length - 1);
  const pts = history.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block">
    <polyline points="${pts}" fill="none" stroke="#10B981" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function heatmapColor(v) {
  const stops = [
    [0,    [241,239,232]],
    [0.25, [211,209,199]],
    [0.5,  [136,135,128]],
    [0.75, [68,68,65]],
    [1,    [44,44,42]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [t0, c0] = stops[i-1], [t1, c1] = stops[i];
      const k = (v - t0) / (t1 - t0 || 1);
      const c = c0.map((c, j) => Math.round(c + (c1[j] - c) * k));
      return `rgb(${c.join(',')})`;
    }
  }
  return 'rgb(44,44,42)';
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ------------------- ONE-TIME STYLE INJECTION ----------------------------- */

function injectFinalResultsStyles() {
  if (document.getElementById('frm-styles')) return;
  const style = document.createElement('style');
  style.id = 'frm-styles';
  style.textContent = `
    .frm-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; z-index: 9999; overflow-y: auto; font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; }
    .frm-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 600px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); color: #111; }
    .frm-header { padding: 22px 24px 18px; display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 0.5px solid rgba(0,0,0,0.08); }
    .frm-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
    .frm-subtitle { font-size: 13px; color: #666; }
    .frm-close { background: transparent; border: none; cursor: pointer; padding: 4px 8px; color: #888; font-size: 22px; line-height: 1; }
    .frm-body { padding: 22px 24px; }
    .frm-hero-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 26px; }
    .frm-hero { background: #f7f7f5; border-radius: 8px; padding: 14px 16px; }
    .frm-hero-label { font-size: 12px; color: #666; margin-bottom: 6px; }
    .frm-hero-value { font-size: 22px; font-weight: 500; line-height: 1.1; }
    .frm-hero-delta { font-size: 12px; margin-top: 4px; color: #666; }
    .frm-section { margin-bottom: 26px; }
    .frm-section-label { font-size: 11px; letter-spacing: 0.04em; color: #888; text-transform: uppercase; margin-bottom: 10px; font-weight: 500; }
    .frm-bar-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; font-size: 13px; }
    .frm-bar-name { width: 110px; }
    .frm-bar-track { flex: 1; height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
    .frm-bar-fill { display: block; height: 100%; border-radius: 3px; }
    .frm-bar-pct { width: 42px; text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    .frm-bar-meta { width: 80px; text-align: right; color: #888; font-size: 12px; font-variant-numeric: tabular-nums; }
    .frm-split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 26px; }
    .frm-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 16px; }
    .frm-budget-line { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; font-size: 14px; }
    .frm-stack-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 12px; background: #eee; }
    .frm-stack-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
    .frm-dot { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 6px; vertical-align: 1px; }
    .frm-pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .frm-pill { padding: 6px 11px; background: #f7f7f5; border-radius: 999px; font-size: 13px; }
    .frm-pill b { font-weight: 500; margin-right: 4px; }
    .frm-flow-row { display: flex; align-items: flex-start; gap: 24px; }
    .frm-heatmap { display: grid; gap: 2px; max-width: 280px; flex: 0 0 auto; }
    .frm-heatmap-cell { aspect-ratio: 1; border-radius: 2px; }
    .frm-flow-legend { font-size: 12px; color: #666; flex: 1; }
    .frm-legend-row { display: flex; align-items: center; gap: 6px; font-size: 11px; }
    .frm-legend-stops { display: inline-flex; gap: 2px; }
    .frm-legend-stops span { width: 10px; height: 10px; border-radius: 2px; }
    .frm-footer { padding: 16px 24px; border-top: 0.5px solid rgba(0,0,0,0.08); display: flex; justify-content: space-between; align-items: center; background: #fafaf8; border-radius: 0 0 12px 12px; }
    .frm-verdict { font-size: 12px; color: #666; }
    .frm-verdict b { color: #111; font-weight: 500; margin-left: 6px; }
    .frm-review, .frm-restart { font-family: inherit; font-size: 13px; padding: 9px 18px; border-radius: 8px; cursor: pointer; }
    .frm-review { background: transparent; color: #666; border: none; }
    .frm-restart { background: #111; color: #fff; border: none; font-weight: 500; }
  `;
  document.head.appendChild(style);
}
