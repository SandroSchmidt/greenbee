/* =============================================================================
   SponsorsComponent — vanilla JS, self-contained UI component
   --------------------------------------------------------------------------
   Usage:
     <div id="sponsors-mount"></div>
     <script src="sponsors-component.js"></script>
     <script>
       const ui = SponsorsComponent.mount('#sponsors-mount', initialSponsorsArray);
       // ...later, on save:
       localGlobal.sponsors = ui.getData();
       // ...to refresh from db without remounting:
       ui.setData(freshArray);
     </script>

   Returned API:
     getData()    → returns sponsors as an array (same shape as input)
     setData(arr) → re-renders the list with the given array
     container    → root DOM element

   Notes:
     - All CSS classes are namespaced "sp-*", scoped through the mount root.
     - Styles are injected once globally; calling mount() repeatedly is safe.
     - Multiple instances on the same page are supported (events scoped per
       container).
   ============================================================================= */

(function (window, document) {
  'use strict';

  if (window.SponsorsComponent) return; // idempotent load

  /* ============================== CONFIG ============================== */
  const GROUPS         = ['Youth', 'Families', 'Seniors'];
  const CHANNEL_COUNT  = 4;
  const STYLE_ELEMENT_ID = 'sponsors-component-styles';

  /* ============================== CSS ============================== */
  const CSS = `
  .sp-panel, .sp-panel * { box-sizing: border-box; }

  .sp-panel {
    --sp-green-50:  #f0fdf4;
    --sp-green-100: #dcfce7;
    --sp-green-200: #bbf7d0;
    --sp-green-500: #22c55e;
    --sp-green-600: #16a34a;
    --sp-green-700: #15803d;
    --sp-slate-900: #0f172a;
    --sp-slate-700: #334155;
    --sp-slate-600: #475569;
    --sp-slate-500: #64748b;
    --sp-slate-400: #94a3b8;
    --sp-slate-300: #cbd5e1;
    --sp-slate-200: #e2e8f0;
    --sp-slate-100: #f1f5f9;
    --sp-slate-50:  #f8fafc;
    --sp-red-500:   #ef4444;
    --sp-red-50:    #fef2f2;
    --sp-subpanel-bg: #fafdf8;
    --sp-panel-header-bg: #f4f9f1;

    background: white;
    border: 1px solid var(--sp-slate-200);
    border-radius: 16px;
    padding: 28px 32px 32px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color: var(--sp-slate-900);
    -webkit-font-smoothing: antialiased;
  }
  .sp-panel-header { display: flex; align-items: center; gap: 8px; }
  .sp-panel-title  { font-size: 20px; font-weight: 700; color: var(--sp-slate-900); margin: 0; }
  .sp-info-icon    { width: 16px; height: 16px; color: var(--sp-slate-400); cursor: help; }
  .sp-panel-desc   { color: var(--sp-slate-500); font-size: 14px; margin: 6px 0 24px; }

  .sp-list-header {
    display: grid;
    grid-template-columns: 56px 72px 1fr 160px 80px;
    gap: 16px;
    padding: 14px 20px;
    background: var(--sp-panel-header-bg);
    border: 1px solid var(--sp-green-100);
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sp-slate-500);
  }
  .sp-list-header .right { text-align: right; }
  .sp-list-body {
    border: 1px solid var(--sp-slate-200);
    border-radius: 0 0 10px 10px;
    overflow: hidden;
    background: white;
  }

  .sp-row {
    border-bottom: 1px solid var(--sp-slate-100);
    transition: background 140ms ease;
  }
  .sp-row:last-child { border-bottom: none; }
  .sp-row.expanded { background: var(--sp-subpanel-bg); }

  .sp-row-summary {
    display: grid;
    grid-template-columns: 56px 72px 1fr 160px 80px;
    gap: 16px;
    padding: 14px 20px;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  .sp-row-icon {
    width: 44px; height: 44px;
    border-radius: 8px;
    background: var(--sp-slate-50);
    border: 1px solid var(--sp-slate-200);
    object-fit: cover;
    padding: 4px;
  }
  .sp-chip {
    width: 56px; height: 44px;
    border-radius: 8px;
    color: white; font-weight: 700; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .sp-row-text { min-width: 0; }
  .sp-row-name {
    font-weight: 600; font-size: 14px; color: var(--sp-slate-900);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sp-row-tag {
    font-size: 13px; color: var(--sp-slate-500);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 3px;
  }

  .sp-row-meta {
    text-align: right;
    display: flex; flex-direction: column;
    gap: 3px; align-items: flex-end;
  }
  .sp-row-meta-line {
    font-size: 12px;
    color: var(--sp-slate-600);
    font-variant-numeric: tabular-nums;
  }
  .sp-row-meta-line strong { color: var(--sp-slate-900); font-weight: 600; }
  .sp-row-meta-line .dot { color: var(--sp-slate-300); margin: 0 4px; }

  .sp-row-actions {
    display: flex; justify-content: flex-end; align-items: center; gap: 4px;
  }
  .sp-icon-btn {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 6px; border: none;
    background: transparent;
    color: var(--sp-slate-500);
    cursor: pointer;
    transition: background 120ms ease, transform 240ms cubic-bezier(.4,0,.2,1);
  }
  .sp-icon-btn:hover { background: var(--sp-slate-100); }
  .sp-icon-btn.danger { background: var(--sp-red-50); color: var(--sp-red-500); }
  .sp-icon-btn.danger:hover { background: #fee2e2; }
  .sp-row.expanded .sp-chevron-btn { transform: rotate(180deg); }

  .sp-row-details {
    max-height: 0;
    overflow: hidden;
    transition: max-height 360ms cubic-bezier(.4,0,.2,1);
  }
  .sp-row.expanded .sp-row-details { max-height: 4000px; }
  .sp-details-inner {
    padding: 4px 24px 24px;
    display: grid;
    gap: 18px;
  }

  .sp-group {
    background: white;
    border: 1px solid var(--sp-slate-200);
    border-radius: 10px;
    padding: 18px 20px;
  }
  .sp-group-header {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 14px; margin-bottom: 14px;
  }
  .sp-section-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--sp-slate-900);
    display: flex; align-items: center; gap: 8px;
    margin: 0;
  }
  .sp-section-label .sp-section-icon {
    width: 14px; height: 14px;
    color: var(--sp-green-600);
  }
  .sp-section-hint {
    font-size: 12px;
    color: var(--sp-slate-400);
    font-style: italic;
  }

  .sp-field-row {
    display: grid;
    gap: 14px;
    margin-bottom: 14px;
  }
  .sp-field-row:last-child { margin-bottom: 0; }
  .sp-field-row.identity   { grid-template-columns: 1.1fr 1.8fr 0.7fr 1.1fr; }
  .sp-field-row.identity-2 { grid-template-columns: 1fr 1fr; }
  .sp-field-row.cols-4     { grid-template-columns: repeat(4, 1fr); }
  .sp-field-row.cols-3     { grid-template-columns: repeat(3, 1fr); }
  .sp-field-row.one        { grid-template-columns: 1fr; }

  .sp-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .sp-field-label {
    font-size: 12px;
    color: var(--sp-slate-500);
    font-weight: 500;
  }
  .sp-help {
    font-size: 11px;
    color: var(--sp-slate-400);
    margin-top: 4px;
    font-style: italic;
  }

  .sp-input, .sp-textarea {
    font-family: inherit;
    font-size: 14px;
    color: var(--sp-slate-900);
    background: white;
    border: 1px solid var(--sp-slate-200);
    border-radius: 8px;
    padding: 9px 12px;
    outline: none;
    width: 100%;
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }
  .sp-textarea { resize: vertical; min-height: 64px; line-height: 1.45; }
  .sp-input:focus, .sp-textarea:focus {
    border-color: var(--sp-green-500);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  }

  .sp-color-wrap {
    display: flex; align-items: stretch;
    border: 1px solid var(--sp-slate-200);
    border-radius: 8px;
    overflow: hidden;
    background: white;
    height: 38px;
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }
  .sp-color-wrap:focus-within {
    border-color: var(--sp-green-500);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  }
  .sp-color-wrap input[type="color"] {
    width: 38px; border: none; padding: 0;
    background: white; cursor: pointer; appearance: none;
  }
  .sp-color-wrap input[type="color"]::-webkit-color-swatch-wrapper { padding: 4px; }
  .sp-color-wrap input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
  .sp-color-wrap input[type="text"] {
    border: none; outline: none; flex: 1;
    padding: 0 10px;
    font-family: inherit; font-size: 13px;
    border-left: 1px solid var(--sp-slate-200);
    font-variant-numeric: tabular-nums;
    min-width: 0;
  }

  .sp-subcards { display: grid; gap: 10px; }
  .sp-subcard {
    background: var(--sp-slate-50);
    border: 1px solid var(--sp-slate-200);
    border-radius: 8px;
    overflow: hidden;
    transition: opacity 200ms ease, max-height 240ms ease;
  }
  .sp-subcard.removing { opacity: 0; }

  .sp-subcard-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 10px 14px;
    background: white;
    border-bottom: 1px solid var(--sp-slate-200);
  }
  .sp-subcard-title {
    font-size: 12px; font-weight: 600;
    color: var(--sp-slate-700);
    letter-spacing: 0.03em;
    display: flex; align-items: center; gap: 8px;
  }
  .sp-subcard-num {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 20px; height: 20px; padding: 0 6px;
    border-radius: 999px;
    background: var(--sp-green-50);
    color: var(--sp-green-700);
    font-size: 11px; font-weight: 700;
  }
  .sp-subcard-header-controls {
    display: flex; align-items: center; gap: 14px;
  }
  .sp-subcard-body {
    padding: 14px;
    display: grid; gap: 14px;
  }

  .sp-mini-group { display: flex; flex-direction: column; gap: 6px; }
  .sp-mini-label {
    font-size: 12px; color: var(--sp-slate-500); font-weight: 500;
  }
  .sp-mini-fields { display: flex; flex-wrap: wrap; gap: 8px; }
  .sp-mini-field {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 5px 5px 10px;
    background: white;
    border: 1px solid var(--sp-slate-200);
    border-radius: 6px;
  }
  .sp-mini-field-label {
    font-size: 12px; color: var(--sp-slate-500); font-weight: 500;
    white-space: nowrap;
  }
  .sp-mini-field input {
    width: 56px; border: none; outline: none;
    padding: 4px 6px;
    font-family: inherit; font-size: 13px;
    color: var(--sp-slate-900);
    text-align: center;
    font-variant-numeric: tabular-nums;
    background: var(--sp-slate-50);
    border-radius: 4px;
  }
  .sp-mini-field input:focus { background: var(--sp-green-50); }

  .sp-toggle {
    position: relative; display: inline-block;
    width: 36px; height: 20px;
    flex-shrink: 0;
  }
  .sp-toggle input { opacity: 0; width: 0; height: 0; }
  .sp-toggle-slider {
    position: absolute; cursor: pointer; inset: 0;
    background: var(--sp-slate-300);
    border-radius: 20px;
    transition: background 180ms ease;
  }
  .sp-toggle-slider::before {
    content: "";
    position: absolute;
    width: 14px; height: 14px;
    left: 3px; top: 3px;
    background: white;
    border-radius: 50%;
    transition: transform 180ms cubic-bezier(.4,0,.2,1);
    box-shadow: 0 1px 2px rgba(0,0,0,.2);
  }
  .sp-toggle input:checked + .sp-toggle-slider { background: var(--sp-green-600); }
  .sp-toggle input:checked + .sp-toggle-slider::before { transform: translateX(16px); }

  .sp-inline-toggle {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--sp-slate-600); cursor: pointer;
  }

  .sp-add-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    border-radius: 999px;
    background: white;
    border: 1px solid var(--sp-green-200);
    color: var(--sp-green-700);
    font-weight: 600; font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    transition: background 120ms ease, border-color 120ms ease;
  }
  .sp-add-btn:hover {
    background: var(--sp-green-50);
    border-color: var(--sp-green-500);
  }
  .sp-add-sponsor-btn { margin-top: 16px; }
  .sp-add-subcard {
    font-size: 12px;
    padding: 6px 12px;
    font-weight: 500;
    margin-top: 12px;
  }

  .sp-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--sp-slate-400);
    font-size: 14px;
  }
  .sp-empty-sub {
    padding: 14px;
    text-align: center;
    color: var(--sp-slate-400);
    font-size: 12px;
    font-style: italic;
    background: white;
    border: 1px dashed var(--sp-slate-200);
    border-radius: 6px;
  }

  @media (max-width: 900px) {
    .sp-list-header { display: none; }
    .sp-row-summary { grid-template-columns: 44px 1fr 80px; gap: 12px; padding: 12px 14px; }
    .sp-row-chip-col, .sp-row-meta { display: none; }
    .sp-row-icon { width: 44px; height: 44px; }
    .sp-details-inner { padding: 4px 14px 18px; }
    .sp-group { padding: 14px; }
    .sp-field-row.identity   { grid-template-columns: 1fr 1fr; }
    .sp-field-row.identity-2 { grid-template-columns: 1fr; }
    .sp-field-row.cols-4 { grid-template-columns: repeat(2, 1fr); }
    .sp-field-row.cols-3 { grid-template-columns: 1fr; }
    .sp-subcard-header { flex-wrap: wrap; }
  }
  `;

  /* ============================== HELPERS ============================== */
  function injectStyles() {
    if (document.getElementById(STYLE_ELEMENT_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  function escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;' }[c]; }); }
  function num(v, def)    { const n = parseFloat(v); return Number.isFinite(n) ? n : (def == null ? 0 : def); }
  function intNum(v, def) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : (def == null ? 0 : def); }

  /* ============================== TEMPLATES ============================== */
  function panelChromeHtml() {
    return `
      <div class="sp-panel-header">
        <h2 class="sp-panel-title">Sponsors</h2>
        <svg class="sp-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </div>
      <p class="sp-panel-desc">Sponsors that can offer the player a deal. Each sponsor has one or more <strong>requirement sets</strong> (player must meet at least one) and a list of <strong>possible offers</strong> (one is chosen at random when the deal is sent).</p>

      <div class="sp-list-header">
        <div>ICON</div>
        <div>BRAND</div>
        <div>NAME &middot; TAGLINE</div>
        <div class="right">RULES</div>
        <div></div>
      </div>
      <div class="sp-list-body" data-sponsors-list></div>

      <button class="sp-add-btn sp-add-sponsor-btn" data-add-sponsor type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Sponsor
      </button>
    `;
  }

  function reqSetHtml(r, idx) {
    const r0 = r || {};
    const sui = r0.min_suitability_per_group || [0, 0, 0];
    const turns = Array.isArray(r0.min_ticket_sales_efficiency_last_turns)
      ? r0.min_ticket_sales_efficiency_last_turns.join(', ') : '';

    return `
      <div class="sp-subcard" data-req-set>
        <div class="sp-subcard-header">
          <div class="sp-subcard-title">
            <span class="sp-subcard-num" data-req-num>${idx + 1}</span>
            Requirement Set
          </div>
          <div class="sp-subcard-header-controls">
            <label class="sp-inline-toggle">
              <span class="sp-toggle">
                <input type="checkbox" data-req-field="sales_team_required" ${r0.sales_team_required ? 'checked' : ''}>
                <span class="sp-toggle-slider"></span>
              </span>
              <span>Requires sales team</span>
            </label>
            <button type="button" class="sp-icon-btn danger" data-delete-req aria-label="Delete requirement set">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="sp-subcard-body">
          <div class="sp-field-row cols-4">
            <div class="sp-field">
              <label class="sp-field-label">Min ticket sales (%)</label>
              <input class="sp-input" type="number" data-req-field="min_ticket_sales_percentage" value="${num(r0.min_ticket_sales_percentage)}">
            </div>
            <div class="sp-field">
              <label class="sp-field-label">Min infra investment ($)</label>
              <input class="sp-input" type="number" data-req-field="min_infrastructural_investment" value="${num(r0.min_infrastructural_investment)}">
            </div>
            <div class="sp-field">
              <label class="sp-field-label">Min vendors</label>
              <input class="sp-input" type="number" data-req-field="min_vendors" value="${intNum(r0.min_vendors)}">
            </div>
            <div class="sp-field">
              <label class="sp-field-label">Min appointed speakers</label>
              <input class="sp-input" type="number" data-req-field="min_appointed_speakers" value="${intNum(r0.min_appointed_speakers)}">
            </div>
          </div>

          <div class="sp-mini-group">
            <div class="sp-mini-label">Min suitability per group</div>
            <div class="sp-mini-fields">
              ${GROUPS.map((g, i) => `
                <div class="sp-mini-field">
                  <span class="sp-mini-field-label">${g}</span>
                  <input type="number" data-req-field="sui_${i}" value="${num(sui[i])}">
                </div>`).join('')}
            </div>
          </div>

          <div class="sp-field">
            <label class="sp-field-label">Min ticket-sales efficiency, recent turns</label>
            <input class="sp-input" type="text" data-req-field="min_ticket_sales_efficiency_last_turns" value="${escAttr(turns)}" placeholder="e.g. 0.9, 0.9, 0.85">
            <div class="sp-help">Comma-separated; one value per recent turn (last value = most recent turn). Empty = no minimum turns required.</div>
          </div>
        </div>
      </div>`;
  }

  function offerHtml(o, idx) {
    const o0 = o || {};
    const sui = o0.suitability_effect || [0, 0, 0];
    const mkt = o0.marketing_effect   || [0, 0, 0, 0];
    return `
      <div class="sp-subcard" data-offer>
        <div class="sp-subcard-header">
          <div class="sp-subcard-title">
            <span class="sp-subcard-num" data-offer-num>${idx + 1}</span>
            Offer
          </div>
          <div class="sp-subcard-header-controls">
            <button type="button" class="sp-icon-btn danger" data-delete-offer aria-label="Delete offer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="sp-subcard-body">
          <div class="sp-field-row cols-3">
            <div class="sp-field">
              <label class="sp-field-label">Installments</label>
              <input class="sp-input" type="number" min="1" data-offer-field="installments" value="${intNum(o0.installments, 1)}">
            </div>
            <div class="sp-field">
              <label class="sp-field-label">Amount per installment ($)</label>
              <input class="sp-input" type="number" data-offer-field="amount" value="${num(o0.amount)}">
            </div>
            <div class="sp-field">
              <label class="sp-field-label">Ticket reasonableness boost (%)</label>
              <input class="sp-input" type="number" data-offer-field="ticket_reasonableness_boost" value="${num(o0.ticket_reasonableness_boost)}">
            </div>
          </div>

          <div class="sp-mini-group">
            <div class="sp-mini-label">Suitability effect (per group)</div>
            <div class="sp-mini-fields">
              ${GROUPS.map((g, i) => `
                <div class="sp-mini-field">
                  <span class="sp-mini-field-label">${g}</span>
                  <input type="number" data-offer-field="sui_eff_${i}" value="${num(sui[i])}">
                </div>`).join('')}
            </div>
          </div>

          <div class="sp-mini-group">
            <div class="sp-mini-label">Marketing effect (per channel)</div>
            <div class="sp-mini-fields">
              ${Array.from({ length: CHANNEL_COUNT }, (_, i) => `
                <div class="sp-mini-field">
                  <span class="sp-mini-field-label">Ch.${i + 1}</span>
                  <input type="number" data-offer-field="mkt_eff_${i}" value="${num(mkt[i])}">
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
  }

  function sponsorRowHtml(s) {
    const initials = (s.initials || '').slice(0, 4);
    const color    = s.color || '#0f172a';
    const reqCount = (s.requirement_sets || []).length;
    const offCount = (s.possible_offers  || []).length;

    const reqsHtml = (s.requirement_sets || []).map((r, i) => reqSetHtml(r, i)).join('')
      || `<div class="sp-empty-sub">No requirement sets yet &mdash; this sponsor will never trigger.</div>`;
    const offersHtml = (s.possible_offers || []).map((o, i) => offerHtml(o, i)).join('')
      || `<div class="sp-empty-sub">No offers yet &mdash; add at least one.</div>`;

    return `
      <div class="sp-row" data-sponsor>
        <div class="sp-row-summary" data-toggle>
          <img class="sp-row-icon" src="${escAttr(s.icon)}" onerror="this.style.visibility='hidden'" alt="">
          <div class="sp-chip sp-row-chip-col" style="background:${escAttr(color)}">${escHtml(initials)}</div>
          <div class="sp-row-text">
            <div class="sp-row-name">${escHtml(s.name || 'Untitled sponsor')}</div>
            <div class="sp-row-tag">${escHtml(s.tagline || '')}</div>
          </div>
          <div class="sp-row-meta">
            <div class="sp-row-meta-line">
              <strong data-meta-reqs>${reqCount}</strong> req${reqCount === 1 ? '' : 's'}
              <span class="dot">&middot;</span>
              <strong data-meta-offers>${offCount}</strong> offer${offCount === 1 ? '' : 's'}
            </div>
          </div>
          <div class="sp-row-actions">
            <button type="button" class="sp-icon-btn sp-chevron-btn" aria-label="Expand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" class="sp-icon-btn danger" data-delete-sponsor aria-label="Delete sponsor">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="sp-row-details">
          <div class="sp-details-inner">

            <div class="sp-group">
              <div class="sp-group-header">
                <h4 class="sp-section-label">
                  <svg class="sp-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Identity
                </h4>
              </div>
              <div class="sp-field-row identity">
                <div class="sp-field">
                  <label class="sp-field-label">ID (key)</label>
                  <input class="sp-input" data-field="id" value="${escAttr(s.id)}">
                </div>
                <div class="sp-field">
                  <label class="sp-field-label">Name</label>
                  <input class="sp-input" data-field="name" value="${escAttr(s.name)}">
                </div>
                <div class="sp-field">
                  <label class="sp-field-label">Initials</label>
                  <input class="sp-input" data-field="initials" maxlength="4" value="${escAttr(s.initials)}">
                </div>
                <div class="sp-field">
                  <label class="sp-field-label">Brand color</label>
                  <div class="sp-color-wrap">
                    <input type="color" data-field="color-picker" value="${escAttr(color)}">
                    <input type="text"  data-field="color" value="${escAttr(color)}" spellcheck="false">
                  </div>
                </div>
              </div>
              <div class="sp-field-row identity-2">
                <div class="sp-field">
                  <label class="sp-field-label">Tagline</label>
                  <input class="sp-input" data-field="tagline" value="${escAttr(s.tagline)}">
                </div>
                <div class="sp-field">
                  <label class="sp-field-label">Icon path</label>
                  <input class="sp-input" data-field="icon" value="${escAttr(s.icon)}" spellcheck="false">
                </div>
              </div>
            </div>

            <div class="sp-group">
              <div class="sp-group-header">
                <h4 class="sp-section-label">
                  <svg class="sp-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Requirement Sets
                </h4>
                <span class="sp-section-hint">Player must meet at least one</span>
              </div>
              <div class="sp-subcards" data-reqs-list>${reqsHtml}</div>
              <button type="button" class="sp-add-btn sp-add-subcard" data-add-req>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Requirement Set
              </button>
            </div>

            <div class="sp-group">
              <div class="sp-group-header">
                <h4 class="sp-section-label">
                  <svg class="sp-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                  Possible Offers
                </h4>
                <span class="sp-section-hint">One is chosen at random when sent</span>
              </div>
              <div class="sp-subcards" data-offers-list>${offersHtml}</div>
              <button type="button" class="sp-add-btn sp-add-subcard" data-add-offer>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Offer
              </button>
            </div>

          </div>
        </div>
      </div>`;
  }

  /* ============================== MOUNT ============================== */
  function mount(target, initialData) {
    injectStyles();

    const container = typeof target === 'string'
      ? document.querySelector(target)
      : target;
    if (!container) {
      throw new Error('SponsorsComponent.mount: target element not found: ' + target);
    }

    container.classList.add('sp-panel');
    container.innerHTML = panelChromeHtml();

    const listEl = container.querySelector('[data-sponsors-list]');

    /* ---- render ---- */
    function render(sponsors) {
      if (!sponsors || sponsors.length === 0) {
        listEl.innerHTML = `<div class="sp-empty">No sponsors yet. Click "Add Sponsor" below to create one.</div>`;
        return;
      }
      listEl.innerHTML = sponsors.map(sponsorRowHtml).join('');
    }

    /* ---- gather ---- */
    function getData() {
      const rows = Array.from(listEl.querySelectorAll(':scope > [data-sponsor]'));
      return rows.map(row => {
        const get = f => row.querySelector(`[data-field="${f}"]`)?.value ?? '';
        const id = get('id').trim();
        if (!id) return null;

        const reqsList = row.querySelector('[data-reqs-list]');
        const requirement_sets = Array.from(reqsList.querySelectorAll(':scope > [data-req-set]')).map(rs => {
          const rget = f => rs.querySelector(`[data-req-field="${f}"]`);
          const turnsStr = rget('min_ticket_sales_efficiency_last_turns').value.trim();
          return {
            sales_team_required: rget('sales_team_required').checked,
            min_ticket_sales_percentage: num(rget('min_ticket_sales_percentage').value),
            min_ticket_sales_efficiency_last_turns: turnsStr
              ? turnsStr.split(',').map(s => num(s.trim()))
              : [],
            min_suitability_per_group: [
              num(rget('sui_0').value),
              num(rget('sui_1').value),
              num(rget('sui_2').value)
            ],
            min_infrastructural_investment: num(rget('min_infrastructural_investment').value),
            min_vendors: intNum(rget('min_vendors').value),
            min_appointed_speakers: intNum(rget('min_appointed_speakers').value)
          };
        });

        const offersList = row.querySelector('[data-offers-list]');
        const possible_offers = Array.from(offersList.querySelectorAll(':scope > [data-offer]')).map(of => {
          const oget = f => of.querySelector(`[data-offer-field="${f}"]`);
          return {
            installments: intNum(oget('installments').value, 1),
            amount: num(oget('amount').value),
            suitability_effect: [
              num(oget('sui_eff_0').value),
              num(oget('sui_eff_1').value),
              num(oget('sui_eff_2').value)
            ],
            marketing_effect: Array.from({ length: CHANNEL_COUNT }, (_, i) => num(oget(`mkt_eff_${i}`).value)),
            ticket_reasonableness_boost: num(oget('ticket_reasonableness_boost').value)
          };
        });

        return {
          id,
          name: get('name').trim(),
          initials: get('initials').trim().slice(0, 4),
          color: get('color').trim() || '#0f172a',
          tagline: get('tagline').trim(),
          icon: get('icon').trim(),
          requirement_sets,
          possible_offers
        };
      }).filter(Boolean);
    }

    /* ---- live helpers ---- */
    function renumber(row) {
      const reqs = row.querySelectorAll('[data-reqs-list] > [data-req-set]');
      reqs.forEach((el, i) => { el.querySelector('[data-req-num]').textContent = i + 1; });
      const offers = row.querySelectorAll('[data-offers-list] > [data-offer]');
      offers.forEach((el, i) => { el.querySelector('[data-offer-num]').textContent = i + 1; });

      const meta = row.querySelector('.sp-row-meta-line');
      if (meta) {
        meta.innerHTML = `<strong data-meta-reqs>${reqs.length}</strong> req${reqs.length === 1 ? '' : 's'} <span class="dot">&middot;</span> <strong data-meta-offers>${offers.length}</strong> offer${offers.length === 1 ? '' : 's'}`;
      }
    }

    function animateRemove(el, after) {
      el.style.maxHeight = el.offsetHeight + 'px';
      el.classList.add('removing');
      requestAnimationFrame(() => {
        el.style.maxHeight = '0';
        el.style.padding = '0';
        el.style.marginTop = '0';
        el.style.marginBottom = '0';
        el.style.overflow = 'hidden';
      });
      setTimeout(() => {
        el.remove();
        if (after) after();
      }, 240);
    }

    /* ---- event delegation (scoped to container) ---- */
    container.addEventListener('click', e => {
      // Add Sponsor button (lives in panel chrome, not inside a row)
      if (e.target.closest('[data-add-sponsor]')) {
        const empty = listEl.querySelector('.sp-empty');
        if (empty) listEl.innerHTML = '';
        const blank = {
          id: '', name: 'New sponsor', initials: 'NS', color: '#16a34a',
          tagline: 'Short tagline', icon: '',
          requirement_sets: [], possible_offers: []
        };
        listEl.insertAdjacentHTML('beforeend', sponsorRowHtml(blank));
        const newRow = listEl.lastElementChild;
        newRow.classList.add('expanded');
        const idInput = newRow.querySelector('[data-field="id"]');
        if (idInput) idInput.focus();
        return;
      }

      const row = e.target.closest('[data-sponsor]');
      if (!row) return;

      if (e.target.closest('[data-delete-sponsor]')) {
        e.stopPropagation();
        animateRemove(row);
        return;
      }
      const delReq = e.target.closest('[data-delete-req]');
      if (delReq) {
        e.stopPropagation();
        animateRemove(delReq.closest('[data-req-set]'), () => renumber(row));
        return;
      }
      const delOff = e.target.closest('[data-delete-offer]');
      if (delOff) {
        e.stopPropagation();
        animateRemove(delOff.closest('[data-offer]'), () => renumber(row));
        return;
      }
      if (e.target.closest('[data-add-req]')) {
        e.stopPropagation();
        const list = row.querySelector('[data-reqs-list]');
        const empty = list.querySelector('.sp-empty-sub'); if (empty) empty.remove();
        list.insertAdjacentHTML('beforeend', reqSetHtml({
          sales_team_required: false,
          min_ticket_sales_percentage: 0,
          min_ticket_sales_efficiency_last_turns: [],
          min_suitability_per_group: [0, 0, 0],
          min_infrastructural_investment: 0,
          min_vendors: 0,
          min_appointed_speakers: 0
        }, list.querySelectorAll('[data-req-set]').length));
        renumber(row);
        return;
      }
      if (e.target.closest('[data-add-offer]')) {
        e.stopPropagation();
        const list = row.querySelector('[data-offers-list]');
        const empty = list.querySelector('.sp-empty-sub'); if (empty) empty.remove();
        list.insertAdjacentHTML('beforeend', offerHtml({
          installments: 1, amount: 0,
          suitability_effect: [0, 0, 0],
          marketing_effect: [0, 0, 0, 0],
          ticket_reasonableness_boost: 0
        }, list.querySelectorAll('[data-offer]').length));
        renumber(row);
        return;
      }

      // Toggle row expansion (ignore clicks inside details panel)
      if (e.target.closest('.sp-row-details')) return;
      if (!e.target.closest('[data-toggle]')) return;
      row.classList.toggle('expanded');
    });

    // Live-sync summary preview from edit inputs
    container.addEventListener('input', e => {
      const row = e.target.closest('[data-sponsor]');
      if (!row) return;
      const field = e.target.getAttribute('data-field');
      if (!field) return;

      const chip = row.querySelector('.sp-chip');

      if (field === 'color-picker') {
        row.querySelector('[data-field="color"]').value = e.target.value;
        if (chip) chip.style.background = e.target.value;
      } else if (field === 'color') {
        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
          row.querySelector('[data-field="color-picker"]').value = e.target.value;
          if (chip) chip.style.background = e.target.value;
        }
      } else if (field === 'initials') {
        if (chip) chip.textContent = e.target.value.slice(0, 4);
      } else if (field === 'name') {
        row.querySelector('.sp-row-name').textContent = e.target.value || 'Untitled sponsor';
      } else if (field === 'tagline') {
        row.querySelector('.sp-row-tag').textContent = e.target.value;
      } else if (field === 'icon') {
        const img = row.querySelector('.sp-row-icon');
        img.src = e.target.value;
        img.style.visibility = 'visible';
      }
    });

    // Initial render
    render(initialData || []);

    return {
      getData: getData,
      setData: render,
      container: container
    };
  }

  /* ============================== EXPORT ============================== */
  window.SponsorsComponent = { mount: mount };

})(window, document);
