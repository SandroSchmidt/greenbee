/* =============================================================================
   SpeakersComponent — vanilla JS, self-contained UI component
   --------------------------------------------------------------------------
   Usage:
     <div id="speakers-mount"></div>
     <script src="speakers-component.js"></script>
     <script>
       const ui = SpeakersComponent.mount('#speakers-mount', initialSpeakersArray);
       // later, on save:
       localGlobal.speakers = ui.getData();
       // to refresh without remounting:
       ui.setData(freshArray);
     </script>

   Returned API:
     getData()    → returns speakers as an array (same shape as input)
     setData(arr) → re-renders the list with the given array
     container    → root DOM element

   Notes:
     - All CSS classes are namespaced "sk-*".
     - Styles are injected once globally; mount() is idempotent.
     - Multiple instances on the same page are supported (events scoped per
       container).
   ============================================================================= */

(function (window, document) {
  'use strict';

  if (window.SpeakersComponent) return;

  /* ============================== CONFIG ============================== */
  const APPEAL_GROUPS = ['Youth', 'Families', 'Seniors']; // multi-select tags
  const SUI_GROUPS    = ['Youth', 'Families', 'Seniors']; // suitability triplet labels
  const STYLE_ELEMENT_ID = 'speakers-component-styles';

  // Curated named-color palette. The saved value is the name string; the hex
  // is only used for visual rendering. Names outside this list are still
  // accepted via the text input (chip falls back to raw value, which CSS may
  // resolve as a named color or invalid).
  const COLOR_PALETTE = [
    { name: 'red',    hex: '#ef4444' },
    { name: 'orange', hex: '#f97316' },
    { name: 'amber',  hex: '#f59e0b' },
    { name: 'green',  hex: '#22c55e' },
    { name: 'teal',   hex: '#14b8a6' },
    { name: 'sky',    hex: '#0ea5e9' },
    { name: 'blue',   hex: '#3b82f6' },
    { name: 'violet', hex: '#8b5cf6' },
    { name: 'pink',   hex: '#ec4899' },
    { name: 'rose',   hex: '#f43f5e' },
    { name: 'slate',  hex: '#64748b' }
  ];
  function resolveColor(name) {
    const found = COLOR_PALETTE.find(c => c.name === name);
    return found ? found.hex : (name || '#64748b');
  }

  /* ============================== CSS ============================== */
  const CSS = `
  .sk-panel, .sk-panel * { box-sizing: border-box; }

  .sk-panel {
    --sk-green-50:  #f0fdf4;
    --sk-green-100: #dcfce7;
    --sk-green-200: #bbf7d0;
    --sk-green-500: #22c55e;
    --sk-green-600: #16a34a;
    --sk-green-700: #15803d;
    --sk-slate-900: #0f172a;
    --sk-slate-700: #334155;
    --sk-slate-600: #475569;
    --sk-slate-500: #64748b;
    --sk-slate-400: #94a3b8;
    --sk-slate-300: #cbd5e1;
    --sk-slate-200: #e2e8f0;
    --sk-slate-100: #f1f5f9;
    --sk-slate-50:  #f8fafc;
    --sk-red-500:   #ef4444;
    --sk-red-50:    #fef2f2;
    --sk-subpanel-bg: #fafdf8;
    --sk-panel-header-bg: #f4f9f1;

    background: white;
    border: 1px solid var(--sk-slate-200);
    border-radius: 16px;
    padding: 28px 32px 32px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color: var(--sk-slate-900);
    -webkit-font-smoothing: antialiased;
  }
  .sk-panel-header { display: flex; align-items: center; gap: 8px; }
  .sk-panel-title  { font-size: 20px; font-weight: 700; color: var(--sk-slate-900); margin: 0; }
  .sk-info-icon    { width: 16px; height: 16px; color: var(--sk-slate-400); cursor: help; }
  .sk-panel-desc   { color: var(--sk-slate-500); font-size: 14px; margin: 6px 0 24px; }

  .sk-list-header {
    display: grid;
    grid-template-columns: 56px 72px 1fr 140px 80px;
    gap: 16px;
    padding: 14px 20px;
    background: var(--sk-panel-header-bg);
    border: 1px solid var(--sk-green-100);
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sk-slate-500);
  }
  .sk-list-header .right { text-align: right; }
  .sk-list-body {
    border: 1px solid var(--sk-slate-200);
    border-radius: 0 0 10px 10px;
    overflow: hidden;
    background: white;
  }

  .sk-row {
    border-bottom: 1px solid var(--sk-slate-100);
    transition: background 140ms ease;
  }
  .sk-row:last-child { border-bottom: none; }
  .sk-row.expanded { background: var(--sk-subpanel-bg); }

  .sk-row-summary {
    display: grid;
    grid-template-columns: 56px 72px 1fr 140px 80px;
    gap: 16px;
    padding: 14px 20px;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  .sk-row-icon {
    width: 44px; height: 44px;
    border-radius: 8px;
    background: var(--sk-slate-50);
    border: 1px solid var(--sk-slate-200);
    object-fit: cover;
    padding: 4px;
  }
  .sk-chip {
    width: 56px; height: 44px;
    border-radius: 8px;
    color: white; font-weight: 700; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .sk-row-text { min-width: 0; }
  .sk-row-name {
    font-weight: 600; font-size: 14px; color: var(--sk-slate-900);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sk-row-topic {
    font-size: 13px; color: var(--sk-slate-500);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 3px;
  }

  .sk-row-fee {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--sk-slate-700);
    font-size: 14px;
    font-weight: 500;
  }
  .sk-row-fee .lbl {
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: var(--sk-slate-400);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 2px;
  }

  .sk-row-actions {
    display: flex; justify-content: flex-end; align-items: center; gap: 4px;
  }
  .sk-icon-btn {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 6px; border: none;
    background: transparent;
    color: var(--sk-slate-500);
    cursor: pointer;
    transition: background 120ms ease, transform 240ms cubic-bezier(.4,0,.2,1);
  }
  .sk-icon-btn:hover { background: var(--sk-slate-100); }
  .sk-icon-btn.danger { background: var(--sk-red-50); color: var(--sk-red-500); }
  .sk-icon-btn.danger:hover { background: #fee2e2; }
  .sk-row.expanded .sk-chevron-btn { transform: rotate(180deg); }

  .sk-row-details {
    max-height: 0;
    overflow: hidden;
    transition: max-height 320ms cubic-bezier(.4,0,.2,1);
  }
  .sk-row.expanded .sk-row-details { max-height: 1600px; }
  .sk-details-inner {
    padding: 4px 24px 24px;
    display: grid;
    gap: 18px;
  }

  .sk-group {
    background: white;
    border: 1px solid var(--sk-slate-200);
    border-radius: 10px;
    padding: 18px 20px;
  }
  .sk-group-header {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 14px; margin-bottom: 14px;
  }
  .sk-section-label {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--sk-slate-500);
    display: flex; align-items: center; gap: 8px;
    margin: 0;
  }
  .sk-section-label .sk-section-icon {
    width: 14px; height: 14px;
    color: var(--sk-green-600);
  }
  .sk-section-hint {
    font-size: 12px;
    color: var(--sk-slate-400);
    font-style: italic;
  }

  .sk-field-row {
    display: grid;
    gap: 14px;
    margin-bottom: 14px;
  }
  .sk-field-row:last-child { margin-bottom: 0; }
  .sk-field-row.identity-1 { grid-template-columns: 1fr 1.8fr 1.5fr 0.8fr; }
  .sk-field-row.identity-2 { grid-template-columns: 0.6fr 1.6fr 2fr; }
  .sk-field-row.one        { grid-template-columns: 1fr; }

  .sk-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .sk-field-label {
    font-size: 12px;
    color: var(--sk-slate-500);
    font-weight: 500;
  }
  .sk-help {
    font-size: 11px;
    color: var(--sk-slate-400);
    margin-top: 4px;
    font-style: italic;
  }

  .sk-input {
    font-family: inherit;
    font-size: 14px;
    color: var(--sk-slate-900);
    background: white;
    border: 1px solid var(--sk-slate-200);
    border-radius: 8px;
    padding: 9px 12px;
    outline: none;
    width: 100%;
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }
  .sk-input:focus {
    border-color: var(--sk-green-500);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  }

  /* color picker — named palette with text fallback */
  .sk-color-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sk-color-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 8px;
    background: white;
    border: 1px solid var(--sk-slate-200);
    border-radius: 8px;
    min-height: 38px;
    align-items: center;
  }
  .sk-color-swatch {
    width: 22px; height: 22px;
    border-radius: 50%;
    border: 2px solid transparent;
    padding: 0;
    cursor: pointer;
    transition: transform 140ms ease, border-color 140ms ease;
    position: relative;
    flex-shrink: 0;
  }
  .sk-color-swatch:hover { transform: scale(1.12); }
  .sk-color-swatch.selected {
    border-color: var(--sk-slate-900);
    box-shadow: inset 0 0 0 2px white;
  }
  .sk-color-text {
    font-family: inherit;
    font-size: 13px;
    color: var(--sk-slate-700);
    background: var(--sk-slate-50);
    border: 1px solid var(--sk-slate-200);
    border-radius: 6px;
    padding: 6px 10px;
    outline: none;
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }
  .sk-color-text:focus {
    border-color: var(--sk-green-500);
    background: white;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  }

  /* appeal multi-select pills */
  .sk-appeal-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sk-appeal-pill {
    padding: 7px 16px;
    border-radius: 999px;
    border: 1px solid var(--sk-slate-200);
    background: white;
    color: var(--sk-slate-600);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sk-appeal-pill:hover { border-color: var(--sk-slate-300); }
  .sk-appeal-pill.active {
    background: var(--sk-green-50);
    border-color: var(--sk-green-500);
    color: var(--sk-green-700);
  }
  .sk-appeal-pill .sk-pill-check {
    width: 14px; height: 14px;
    border-radius: 50%;
    border: 1.5px solid var(--sk-slate-300);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 140ms ease, border-color 140ms ease;
    flex-shrink: 0;
  }
  .sk-appeal-pill.active .sk-pill-check {
    background: var(--sk-green-600);
    border-color: var(--sk-green-600);
  }
  .sk-appeal-pill .sk-pill-check svg {
    width: 9px; height: 9px;
    color: white;
    opacity: 0;
    transition: opacity 140ms ease;
  }
  .sk-appeal-pill.active .sk-pill-check svg { opacity: 1; }

  /* suitability mini-fields */
  .sk-mini-group { display: flex; flex-direction: column; gap: 6px; }
  .sk-mini-label {
    font-size: 12px; color: var(--sk-slate-500); font-weight: 500;
  }
  .sk-mini-fields { display: flex; flex-wrap: wrap; gap: 8px; }
  .sk-mini-field {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 5px 5px 10px;
    background: white;
    border: 1px solid var(--sk-slate-200);
    border-radius: 6px;
  }
  .sk-mini-field-label {
    font-size: 12px; color: var(--sk-slate-500); font-weight: 500;
    white-space: nowrap;
  }
  .sk-mini-field input {
    width: 56px; border: none; outline: none;
    padding: 4px 6px;
    font-family: inherit; font-size: 13px;
    color: var(--sk-slate-900);
    text-align: center;
    font-variant-numeric: tabular-nums;
    background: var(--sk-slate-50);
    border-radius: 4px;
  }
  .sk-mini-field input:focus { background: var(--sk-green-50); }

  /* buttons */
  .sk-add-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    border-radius: 999px;
    background: white;
    border: 1px solid var(--sk-green-200);
    color: var(--sk-green-700);
    font-weight: 600; font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    transition: background 120ms ease, border-color 120ms ease;
  }
  .sk-add-btn:hover {
    background: var(--sk-green-50);
    border-color: var(--sk-green-500);
  }
  .sk-add-speaker-btn { margin-top: 16px; }

  .sk-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--sk-slate-400);
    font-size: 14px;
  }

  @media (max-width: 900px) {
    .sk-list-header { display: none; }
    .sk-row-summary { grid-template-columns: 44px 1fr 80px; gap: 12px; padding: 12px 14px; }
    .sk-row-chip-col, .sk-row-fee { display: none; }
    .sk-row-icon { width: 44px; height: 44px; }
    .sk-details-inner { padding: 4px 14px 18px; }
    .sk-group { padding: 14px; }
    .sk-field-row.identity-1 { grid-template-columns: 1fr 1fr; }
    .sk-field-row.identity-2 { grid-template-columns: 1fr; }
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
  function fmtFee(n)      { return '$' + (Number(n) || 0).toLocaleString(); }

  /* ============================== TEMPLATES ============================== */
  function panelChromeHtml() {
    return `
      <div class="sk-panel-header">
        <h2 class="sk-panel-title">Public Speakers</h2>
        <svg class="sk-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </div>
      <p class="sk-panel-desc">Speakers the player can book for the event. Each speaker has a topic, a fee, and a suitability profile that defines how strongly they resonate with each visitor group.</p>

      <div class="sk-list-header">
        <div>ICON</div>
        <div>BRAND</div>
        <div>NAME &middot; TOPIC</div>
        <div class="right">FEE</div>
        <div></div>
      </div>
      <div class="sk-list-body" data-speakers-list></div>

      <button class="sk-add-btn sk-add-speaker-btn" data-add-speaker type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Speaker
      </button>
    `;
  }

  function colorSwatchesHtml(selectedName) {
    return COLOR_PALETTE.map(c => `
      <button type="button"
              class="sk-color-swatch ${c.name === selectedName ? 'selected' : ''}"
              data-color-swatch="${c.name}"
              title="${c.name}"
              style="background:${c.hex}"></button>
    `).join('');
  }

  function appealPillHtml(group, active) {
    return `
      <button type="button" class="sk-appeal-pill ${active ? 'active' : ''}" data-appeal-toggle="${group}">
        <span class="sk-pill-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        ${group}
      </button>`;
  }

  function speakerRowHtml(s) {
    const initials = (s.initials || '').slice(0, 4);
    const color    = s.color || 'slate';
    const colorHex = resolveColor(color);
    const appeal   = Array.isArray(s.appeal) ? s.appeal : [];
    const sui      = Array.isArray(s.suitability) ? s.suitability : [0, 0, 0];

    return `
      <div class="sk-row" data-speaker>
        <div class="sk-row-summary" data-toggle>
          <img class="sk-row-icon" src="${escAttr(s.icon)}" onerror="this.style.visibility='hidden'" alt="">
          <div class="sk-chip sk-row-chip-col" style="background:${escAttr(colorHex)}">${escHtml(initials)}</div>
          <div class="sk-row-text">
            <div class="sk-row-name">${escHtml(s.name || 'Untitled speaker')}</div>
            <div class="sk-row-topic">${escHtml(s.topic || '')}</div>
          </div>
          <div class="sk-row-fee"><span class="lbl">Fee</span>${fmtFee(s.fee)}</div>
          <div class="sk-row-actions">
            <button type="button" class="sk-icon-btn sk-chevron-btn" aria-label="Expand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" class="sk-icon-btn danger" data-delete-speaker aria-label="Delete speaker">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="sk-row-details">
          <div class="sk-details-inner">

            <div class="sk-group">
              <div class="sk-group-header">
                <h4 class="sk-section-label">
                  <svg class="sk-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Identity
                </h4>
              </div>
              <div class="sk-field-row identity-1">
                <div class="sk-field">
                  <label class="sk-field-label">ID (key)</label>
                  <input class="sk-input" data-field="id" value="${escAttr(s.id)}">
                </div>
                <div class="sk-field">
                  <label class="sk-field-label">Name</label>
                  <input class="sk-input" data-field="name" value="${escAttr(s.name)}">
                </div>
                <div class="sk-field">
                  <label class="sk-field-label">Topic</label>
                  <input class="sk-input" data-field="topic" value="${escAttr(s.topic)}">
                </div>
                <div class="sk-field">
                  <label class="sk-field-label">Fee ($)</label>
                  <input class="sk-input" data-field="fee" type="number" min="0" value="${num(s.fee)}">
                </div>
              </div>

              <div class="sk-field-row identity-2">
                <div class="sk-field">
                  <label class="sk-field-label">Initials</label>
                  <input class="sk-input" data-field="initials" maxlength="4" value="${escAttr(s.initials)}">
                </div>
                <div class="sk-field">
                  <label class="sk-field-label">Brand color</label>
                  <div class="sk-color-picker">
                    <div class="sk-color-swatches">${colorSwatchesHtml(color)}</div>
                    <input disabled class="sk-color-text" type="text" data-field="color" value="${escAttr(color)}" spellcheck="false" placeholder="e.g. green">
                  </div>
                </div>
                <div class="sk-field">
                  <label class="sk-field-label">Icon path</label>
                  <input class="sk-input" data-field="icon" value="${escAttr(s.icon)}" spellcheck="false">
                </div>
              </div>
            </div>

            <div class="sk-group">
              <div class="sk-group-header">
                <h4 class="sk-section-label">
                  <svg class="sk-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Audience
                  <span class="info-tooltip info-tooltip--glossary">
          <button type="button" style=" display:flex; justify-content: end; align-items: end;" class="info-tooltip__trigger" aria-label="Explain object parameters">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
          <span style="max-width:400px" class="info-tooltip__content">
            <dl>
              <dt>Effect</dt>
              <dd>
              Audience appeal checkboxes have merely cosmetic purpose - they're shown on the performer card however they do not have any real purpose.
              Suitability per group values has a real purpose - it adds up to suitability of the booth/square.
              </dd>
            </dl>
          </span>
        </span>
                </h4>
                <span class="sk-section-hint">Tag the groups they appeal to, and set per-group suitability</span>
              </div>

              <div class="sk-field">
                <label class="sk-field-label">Audience appeal</label>
                <div class="sk-appeal-row" data-appeal-row>
                  ${APPEAL_GROUPS.map(g => appealPillHtml(g, appeal.includes(g))).join('')}
                </div>
              </div>

              <div class="sk-mini-group" style="margin-top: 14px;">
                <div class="sk-mini-label">Suitability per group</div>
                <div class="sk-mini-fields">
                  ${SUI_GROUPS.map((g, i) => `
                    <div class="sk-mini-field">
                      <span class="sk-mini-field-label">${g}</span>
                      <input type="number" data-field="sui_${i}" value="${num(sui[i])}">
                    </div>`).join('')}
                </div>
              </div>
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
      throw new Error('SpeakersComponent.mount: target element not found: ' + target);
    }

    container.classList.add('sk-panel');
    container.innerHTML = panelChromeHtml();

    const listEl = container.querySelector('[data-speakers-list]');

    /* ---- render ---- */
    function render(speakers) {
      if (!speakers || speakers.length === 0) {
        listEl.innerHTML = `<div class="sk-empty">No speakers yet. Click "Add Speaker" below to create one.</div>`;
        return;
      }
      listEl.innerHTML = speakers.map(speakerRowHtml).join('');
    }

    /* ---- gather ---- */
    function getData() {
      const rows = Array.from(listEl.querySelectorAll(':scope > [data-speaker]'));
      return rows.map(row => {
        const get = f => row.querySelector(`[data-field="${f}"]`)?.value ?? '';
        const id = get('id').trim();
        if (!id) return null;

        const appeal = Array.from(row.querySelectorAll('[data-appeal-toggle].active'))
          .map(b => b.getAttribute('data-appeal-toggle'));

        return {
          id,
          name: get('name').trim(),
          topic: get('topic').trim(),
          initials: get('initials').trim().slice(0, 4),
          color: get('color').trim() || 'slate',
          appeal,
          suitability: [
            num(get('sui_0')),
            num(get('sui_1')),
            num(get('sui_2'))
          ],
          fee: num(get('fee')),
          icon: get('icon').trim()
        };
      }).filter(Boolean);
    }

    /* ---- animation helper ---- */
    function animateRemove(el) {
      el.style.maxHeight = el.offsetHeight + 'px';
      el.style.transition = 'opacity 160ms ease, max-height 220ms ease';
      requestAnimationFrame(() => {
        el.style.opacity = '0';
        el.style.maxHeight = '0';
        el.style.overflow = 'hidden';
      });
      setTimeout(() => el.remove(), 220);
    }

    /* ---- event delegation ---- */
    container.addEventListener('click', e => {
      // Add speaker button (in panel chrome, outside any row)
      if (e.target.closest('[data-add-speaker]')) {
        const empty = listEl.querySelector('.sk-empty');
        if (empty) listEl.innerHTML = '';
        const blank = {
          id: '', name: 'New speaker', topic: '', initials: 'NS',
          color: 'green', appeal: [], suitability: [0, 0, 0],
          fee: 0, icon: ''
        };
        listEl.insertAdjacentHTML('beforeend', speakerRowHtml(blank));
        const newRow = listEl.lastElementChild;
        newRow.classList.add('expanded');
        const idInput = newRow.querySelector('[data-field="id"]');
        if (idInput) idInput.focus();
        return;
      }

      const row = e.target.closest('[data-speaker]');
      if (!row) return;

      // Delete speaker
      if (e.target.closest('[data-delete-speaker]')) {
        e.stopPropagation();
        animateRemove(row);
        return;
      }

      // Color swatch click
      const swatch = e.target.closest('[data-color-swatch]');
      if (swatch) {
        e.stopPropagation();
        const colorName = swatch.getAttribute('data-color-swatch');
        const textInput = row.querySelector('[data-field="color"]');
        textInput.value = colorName;
        row.querySelectorAll('[data-color-swatch]').forEach(s => {
          s.classList.toggle('selected', s === swatch);
        });
        const chip = row.querySelector('.sk-chip');
        if (chip) chip.style.background = resolveColor(colorName);
        return;
      }

      // Appeal pill toggle
      const pill = e.target.closest('[data-appeal-toggle]');
      if (pill) {
        e.stopPropagation();
        pill.classList.toggle('active');
        return;
      }

      // Toggle row expansion (ignore clicks inside details)
      if (e.target.closest('.sk-row-details')) return;
      if (!e.target.closest('[data-toggle]')) return;
      row.classList.toggle('expanded');
    });

    // Live-sync summary preview from edit inputs
    container.addEventListener('input', e => {
      const row = e.target.closest('[data-speaker]');
      if (!row) return;
      const field = e.target.getAttribute('data-field');
      if (!field) return;

      const chip = row.querySelector('.sk-chip');

      if (field === 'color') {
        // Update chip + swatch selection state
        const val = e.target.value.trim();
        if (chip) chip.style.background = resolveColor(val);
        row.querySelectorAll('[data-color-swatch]').forEach(s => {
          s.classList.toggle('selected', s.getAttribute('data-color-swatch') === val);
        });
      } else if (field === 'initials') {
        if (chip) chip.textContent = e.target.value.slice(0, 4);
      } else if (field === 'name') {
        row.querySelector('.sk-row-name').textContent = e.target.value || 'Untitled speaker';
      } else if (field === 'topic') {
        row.querySelector('.sk-row-topic').textContent = e.target.value;
      } else if (field === 'fee') {
        const feeEl = row.querySelector('.sk-row-fee');
        feeEl.innerHTML = `<span class="lbl">Fee</span>${fmtFee(e.target.value)}`;
      } else if (field === 'icon') {
        const img = row.querySelector('.sk-row-icon');
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
  window.SpeakersComponent = { mount: mount };

})(window, document);
