/*
  TicketSalesSettingsComponent
  -----------------------------------------
  Vanilla JS admin UI for configuring ticket sales rules.
 
  Usage:
    const ui = TicketSalesSettingsComponent.mount(
      '#ticket-sales-settings-mount',
      globalSettings.baseRules.ticketSales
    );
 
    // Save: globalSettings.baseRules.ticketSales = ui.getData();
 
  All field tooltips show the placeholder string "Popup content" — fill them
  in per-field by adding `description: '...'` to the entry in FIELD_GROUPS.
 
  Data shape (exactly the shape getData() returns):
  {
    infrastructure: { populationDivisorMinMultiplier, populationDivisorMaxMultiplier,
                      , minInfrastructureDivisor },
    priceReasonableness: { minOptimalPrice, freeTicketFactor, maxFactor, idealFactor,
                           priceSteepness, previousPriceFactorRecencyDecay, previousPriceFactorMaxClamp,
                           historySensitivity, historyAdjustmentMin, historyAdjustmentMax,
                           salesSensitivity, salesMomentumNeutralPoint,
                           brandingMultiplier, premiumWifiMultiplier },
    marketing: { saturationK },
    demand: { maxDemand, minTurnsLeft,
              soldOutSalesEfficiency, minSalesEfficiency, maxSalesEfficiency }
  }
*/
(function () {
  var STYLE_ID = 'ticket-sales-settings-style';
  var PLACEHOLDER_DESC = 'Popup content';
 
  var DEFAULT_TICKET_SALES_RULES = {
    infrastructure: {
      populationDivisorMinMultiplier: 0.1,
      populationDivisorMaxMultiplier: 0.2,

      earlySupportMaxMultiplier: 5,
      earlySupportDurationTurns: 6,

      minInfrastructureDivisor: 1,
    },
    priceReasonableness: {
      minOptimalPrice: 0.5,
      freeTicketFactor: 2.0,
      maxFactor: 2.0,
      idealFactor: 1.0,
      priceSteepness: 1.8,
      previousPriceFactorRecencyDecay: 0.7,
      previousPriceFactorMaxClamp: 2.0,
      historySensitivity: 0.25,
      historyAdjustmentMin: -0.2,
      historyAdjustmentMax: 0.2,
      salesSensitivity: 0.15,
      salesMomentumNeutralPoint: 0.5,
      brandingMultiplier: 1.03,
      premiumWifiMultiplier: 1.01
    },
    marketing: { saturationK: 50 },
    demand: {
      maxDemand: 1.0,
      minTurnsLeft: 1,
      soldOutSalesEfficiency: 1,
      minSalesEfficiency: 0,
      maxSalesEfficiency: 1
    }
  };
 
  // Add `description: '...'` to any field to override the placeholder tooltip.
  var FIELD_GROUPS = [
    { id: 'infrastructure', advanced: false, label: 'INFRASTRUCTURE', description: "Controls how infrastructure spending is converted into an optimal ticket price. Higher infrastructure spending allows higher ticket prices before players are punished for being too expensive.", fields: [
      { path: 'infrastructure.populationDivisorMinMultiplier', label: 'Population divisor min multiplier', description: "Minimum population-based multiplier used when calculating the infrastructure divisor. Lower values make infrastructure spending create a higher optimal ticket price, making expensive tickets easier to justify. It's recommended for min/max to be somewhere around 1/maxTurns", min: 0, step: 0.05 },
      { path: 'infrastructure.populationDivisorMaxMultiplier', label: 'Population divisor max multiplier', description: "Maximum population-based multiplier used when calculating the infrastructure divisor. Higher values make infrastructure spending create a lower optimal ticket price, making expensive tickets harder to justify. It's recommended for min/max to be somewhere around 1/maxTurns", min: 0, step: 0.05 },
      { path: 'infrastructure.earlySupportMaxMultiplier', label: 'Early Support max multiplier', description: "Maximum early-game support applied to infrastructure pricing. Higher values make ticket prices more forgiving at the beginning of the game, allowing players to charge somewhat reasonable prices even before they have built much infrastructure.", min: 0, step: 1 },
      { path: 'infrastructure.earlySupportDurationTurns', label: 'Early Support duration turns', description: "Number of turns over which early-game pricing support gradually fades out. Higher values keep the early game more forgiving for longer; lower values make the game expect players to build enough infrastructure sooner.", min: 0.01, step: 0.1 },
      { path: 'infrastructure.minInfrastructureDivisor', label: 'Min infrastructure divisor', description: "Minimum allowed infrastructure divisor. Prevents division by zero or extremely aggressive price calculations.", min: 0.01, step: 0.1 }
    ]},
    { id: 'priceReasonableness', advanced: true, label: 'PRICE REASONABLENESS', description: "Controls how reasonable the ticket price feels based on infrastructure investment, previous pricing, sales momentum, and optional boosts like branding or premium WiFi.", fields: [
      { path: 'priceReasonableness.minOptimalPrice', label: 'Min optimal price', description: "Lowest possible optimal ticket price. Prevents the optimal price from becoming too small when infrastructure spending is low.", min: 0, step: 0.05 },
      { path: 'priceReasonableness.freeTicketFactor', label: 'Free ticket factor', description: "Price reasonableness value returned when ticket price is zero or below. Higher values make free tickets more powerful.", min: 0, step: 0.1 },
      { path: 'priceReasonableness.maxFactor', label: 'Max factor', description: "Maximum possible price reasonableness score. Higher values allow ticket demand to become stronger when prices are very attractive.",min: 0, step: 0.1 },
      { path: 'priceReasonableness.idealFactor', label: 'Ideal factor', description: "Reasonableness score when ticket price is exactly equal to the calculated optimal price. Usually should stay at 1.0.", min: 0, step: 0.05 },
      { path: 'priceReasonableness.priceSteepness', label: 'Price steepness', description: "Controls how quickly expensive tickets are punished. Higher values make demand drop faster when ticket price goes above the optimal price.", min: 0, step: 0.1 },
      { path: 'priceReasonableness.previousPriceFactorRecencyDecay', label: 'Previous price factor recency decay', description: "Controls how much older price reasonableness results matter. Lower values focus more on recent turns; higher values make older turns matter more.", min: 0, step: 0.05 },
      { path: 'priceReasonableness.previousPriceFactorMaxClamp', label: 'Previous price factor max clamp', description: "Maximum previous price reasonableness value used when calculating historical average. Prevents old values from having extreme influence.", min: 0, step: 0.1 },
      { path: 'priceReasonableness.historySensitivity', label: 'History sensitivity', description: "Controls how strongly current price reasonableness is adjusted based on improvement or decline compared to recent history.", min: 0, step: 0.05 },
      { path: 'priceReasonableness.historyAdjustmentMin', label: 'History adjustment min', description: "Maximum negative adjustment from pricing history. Lower values allow previous bad pricing trends to punish the current result more.", step: 0.05 },
      { path: 'priceReasonableness.historyAdjustmentMax', label: 'History adjustment max', description:  "Maximum positive adjustment from pricing history. Higher values allow improvement over previous pricing to boost the current result more.",step: 0.05 },
      { path: 'priceReasonableness.salesSensitivity', label: 'Sales sensitivity', description: "Controls how much previous sales success affects current price reasonableness. Higher values make strong sales momentum boost demand more and weak sales momentum hurt more.", min: 0, step: 0.05 },
      { path: 'priceReasonableness.salesMomentumNeutralPoint', label: 'Sales momentum neutral point', description: "Sales momentum point considered neutral. Below this value sales momentum penalizes demand; above it sales momentum boosts demand.", min: 0, step: 0.05 },
      { path: 'priceReasonableness.brandingMultiplier', label: 'Branding multiplier', description: "Multiplier applied to price reasonableness when the player has the branding package. Higher values make branding more valuable for ticket sales.", min: 0, step: 0.01 },
      { path: 'priceReasonableness.premiumWifiMultiplier', label: 'Premium wifi multiplier', description: "Multiplier applied to price reasonableness when the player has premium WiFi. Higher values make premium WiFi more valuable for ticket sales.", min: 0, step: 0.01 }
    ]},
    { id: 'marketing', advanced: true, label: 'MARKETING', fields: [
      { path: 'marketing.saturationK', label: 'Saturation K', description: "Controls how quickly marketing interest turns into demand. Lower values make marketing become effective faster; higher values require more marketing interest to reach strong demand.",min: 1, step: 1 }
    ]},
    { id: 'demand', advanced: true, label: 'DEMAND', description: "Controls how demand is converted into actual ticket sales for each audience group.", fields: [
      { path: 'demand.maxDemand', label: 'Max demand', description: "Maximum demand multiplier after combining marketing and price reasonableness. Higher values allow stronger sales spikes; lower values cap sales more aggressively.", min: 0, step: 0.05 },
      { path: 'demand.minTurnsLeft', label: 'Min turns left', description: "Minimum turns-left value used when calculating sales pace. Prevents division by zero near the end of the game.", min: 0, step: 1 },
      { path: 'demand.soldOutSalesEfficiency', label: 'Sold-out sales efficiency', description: "Sales efficiency value returned when an audience group has no remaining tickets to buy. Usually should stay at 1.", min: 0, step: 0.05 },
      { path: 'demand.minSalesEfficiency', label: 'Min sales efficiency', description: "Minimum sales efficiency result for a group. Usually should stay at 0.", min: 0, step: 0.05 },
      { path: 'demand.maxSalesEfficiency', label: 'Max sales efficiency', description:  "Maximum sales efficiency result for a group. Usually should stay at 1.", min: 0, step: 0.05 }
    ]}
  ];
 
  var CHEVRON_SVG = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5L7 9L11 5"/></svg>';
 
  // ---------- Helpers ----------
  function getByPath(obj, path) {
    return String(path).split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, obj);
  }
  function setByPath(obj, path, value) {
    var parts = String(path).split('.'), c = obj;
    parts.forEach(function (p, i) {
      if (i === parts.length - 1) { c[p] = value; return; }
      if (!c[p] || typeof c[p] !== 'object') c[p] = {};
      c = c[p];
    });
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function button(text, cls) {
    var b = document.createElement('button');
    b.className = cls || 'ts-btn';
    b.type = 'button';
    if (text) b.textContent = text;
    return b;
  }
  function parseInputValue(v, fb) {
    if (v === '') return fb == null ? 0 : fb;
    var n = Number(v); return Number.isFinite(n) ? n : (fb == null ? 0 : fb);
  }
  function sanitizeInitialData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return clone(data);
  }
  function mergeDefaults(defaults, incoming) {
    var out = clone(defaults);
    (function merge(t, s) {
      Object.keys(s || {}).forEach(function (k) {
        var v = s[k];
        if (Array.isArray(v)) t[k] = clone(v);
        else if (v && typeof v === 'object') {
          if (!t[k] || typeof t[k] !== 'object' || Array.isArray(t[k])) t[k] = {};
          merge(t[k], v);
        } else if (v !== undefined) t[k] = v;
      });
    })(out, incoming);
    return out;
  }
  function fixFromTo(d, fp, tp) {
    var f = Number(getByPath(d, fp)), t = Number(getByPath(d, tp));
    if (!Number.isFinite(f) || !Number.isFinite(t) || f <= t) return;
    setByPath(d, fp, t); setByPath(d, tp, f);
  }
  function enforceRanges(d) {
    fixFromTo(d, 'infrastructure.populationDivisorMinMultiplier', 'infrastructure.populationDivisorMaxMultiplier');
    fixFromTo(d, 'priceReasonableness.historyAdjustmentMin', 'priceReasonableness.historyAdjustmentMax');
    fixFromTo(d, 'demand.minSalesEfficiency', 'demand.maxSalesEfficiency');
 
    d.infrastructure.minInfrastructureDivisor = Math.max(0.01, Number(d.infrastructure.minInfrastructureDivisor || 0.01));
    d.marketing.saturationK = Math.max(1, Number(d.marketing.saturationK || 1));
    d.demand.minTurnsLeft = Math.max(0, Math.round(Number(d.demand.minTurnsLeft || 0)));
  }
 
  // ---------- Mount ----------
  function mount(selectorOrElement, initialData, options) {
    var root = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
    if (!root) throw new Error('TicketSalesSettingsComponent: mount element not found.');
 
    injectStyles();
 
    var config = Object.assign({
      title: 'Ticket sales settings',
      initiallyExpanded: false
    }, options || {});
 
    var state = mergeDefaults(DEFAULT_TICKET_SALES_RULES, sanitizeInitialData(initialData));
    var isAdvancedOpen = !!config.initiallyExpanded;
    var inputMap = new Map();
 
    render();
 
    function render() {
      inputMap.clear();
      root.innerHTML = '';
      root.classList.add('ts-root');
 
      var card = el('section', 'ts-card');
      if (isAdvancedOpen) card.classList.add('ts-expanded');
      card.appendChild(renderHeader());
      card.appendChild(renderBody());
      root.appendChild(card);
 
      syncAllInputsFromState();
    }
 
    function renderHeader() {
      var h = el('header', 'ts-card-header');
 
      var text = el('div', 'ts-header-text');
      var titleRow = el('div', 'ts-title-row');
      titleRow.appendChild(el('h3', 'ts-title', config.title));
      titleRow.appendChild(renderHelp(PLACEHOLDER_DESC, 'lg'));
      text.appendChild(titleRow);
      text.appendChild(el('p', 'ts-subtitle', 'Configure how ticket demand, price reasonableness, and infrastructure scale drive ticket sales each turn.'));
 
      var actions = el('div', 'ts-header-actions');
      var toggle = button('', 'ts-btn ts-btn-pill ts-btn-toggle');
      toggle.innerHTML =
        '<span class="ts-toggle-label-open">Advanced settings</span>' +
        '<span class="ts-toggle-label-close">Hide advanced</span>' +
        '<span class="ts-toggle-chevron">' + CHEVRON_SVG + '</span>';
      toggle.setAttribute('aria-expanded', isAdvancedOpen ? 'true' : 'false');
      toggle.addEventListener('click', function () {
        isAdvancedOpen = !isAdvancedOpen;
        var c = root.querySelector('.ts-card');
        if (c) c.classList.toggle('ts-expanded', isAdvancedOpen);
        toggle.setAttribute('aria-expanded', isAdvancedOpen ? 'true' : 'false');
      });
      actions.appendChild(toggle);
 
      h.appendChild(text);
      h.appendChild(actions);
      return h;
    }
 
    function renderBody() {
      var body = el('div', 'ts-card-body');
      FIELD_GROUPS.forEach(function (g) {
        var s = renderSection(g);
        if (g.advanced) s.classList.add('ts-advanced-only');
        body.appendChild(s);
      });
      body.appendChild(renderResetFooter());
      return body;
    }
 
    function renderSection(g) {
      var s = el('div', 'ts-section');
      s.dataset.sectionId = g.id;
      s.appendChild(el('div', 'ts-section-label', g.label));
 
      var box = el('div', 'ts-section-box');
      var grid = el('div', 'ts-field-grid');
      g.fields.forEach(function (f) { grid.appendChild(renderField(f)); });
      box.appendChild(grid);
      s.appendChild(box);
      return s;
    }
 
    function renderField(field) {
      var w = el('div', 'ts-field');
      var lr = el('div', 'ts-field-label-row');
      lr.appendChild(el('label', 'ts-field-label', field.label));
      lr.appendChild(renderHelp(field.description || PLACEHOLDER_DESC, 'sm'));
      var input = document.createElement('input');
      input.className = 'ts-input';
      input.type = 'number';
      input.step = String(field.step == null ? 1 : field.step);
      if (field.min !== undefined) input.min = String(field.min);
      if (field.max !== undefined) input.max = String(field.max);
      input.dataset.path = field.path;
      input.addEventListener('input', function () {
        var parsed = parseInputValue(input.value, getByPath(DEFAULT_TICKET_SALES_RULES, field.path));
        setByPath(state, field.path, parsed);
        emitChange();
      });
      inputMap.set(field.path, input);
      w.appendChild(lr);
      w.appendChild(input);
      return w;
    }
 
    function renderHelp(text, size) {
      var w = el('span', 'ts-help ts-help-' + (size || 'sm'));
      w.tabIndex = 0;
      w.setAttribute('role', 'button');
      w.setAttribute('aria-label', text);
      w.textContent = '?';
      var tip = el('span', 'ts-tooltip');
      tip.textContent = text;
      w.appendChild(tip);
      return w;
    }
 
    function renderResetFooter() {
      var f = el('div', 'ts-reset-footer ts-advanced-only');
      var b = button('Reset all to defaults', 'ts-btn ts-btn-pill ts-btn-quiet ts-btn-reset');
      b.addEventListener('click', function () {
        if (!window.confirm('Reset ticket sales settings to default values?')) return;
        state = clone(DEFAULT_TICKET_SALES_RULES);
        rerender();
        emitChange();
      });
      f.appendChild(b);
      return f;
    }
 
    function rerender() {
      var was = isAdvancedOpen;
      render();
      isAdvancedOpen = was;
      var c = root.querySelector('.ts-card');
      if (c) c.classList.toggle('ts-expanded', isAdvancedOpen);
    }
 
    function syncAllInputsFromState() {
      inputMap.forEach(function (input, path) {
        var v = getByPath(state, path);
        input.value = v === undefined || v === null ? '' : String(v);
      });
    }
 
    function emitChange() {
      root.dispatchEvent(new CustomEvent('ticketSalesSettingsChange', { detail: clone(state), bubbles: true }));
    }
 
    return {
      getData: function () { var c = clone(state); enforceRanges(c); return c; },
      setData: function (d) { state = mergeDefaults(DEFAULT_TICKET_SALES_RULES, sanitizeInitialData(d)); rerender(); emitChange(); },
      destroy: function () { root.innerHTML = ''; root.classList.remove('ts-root'); inputMap.clear(); },
      getDefaults: function () { return clone(DEFAULT_TICKET_SALES_RULES); }
    };
  }
 
  // ---------- Styles ----------
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .ts-root { width: 100%; }
      .ts-root, .ts-root * { box-sizing: border-box; }
      .ts-card {
        --ts-cream:#fbfaf3; --ts-paper:#ffffff; --ts-border:#ece9dd;
        --ts-mint:#f1f6e8;
        --ts-text:#1a1a1a; --ts-muted:#6b6b6b; --ts-faint:#a0a09a;
        --ts-input-border:#d8d5cc; --ts-input-border-hover:#c8c5b8;
        --ts-green:#42a55c; --ts-green-soft:#a4d294; --ts-green-bg:#e6f4dc;
        --ts-tooltip-bg:#2a2a28;
        background: var(--ts-paper); border: 1px solid var(--ts-border); border-radius: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: var(--ts-text); font-size: 13px; line-height: 1.5;
        -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
      }
      .ts-card-header {
        background: var(--ts-mint); padding: 18px 20px;
        border-bottom: 1px solid var(--ts-border);
        border-top-left-radius: 13px; border-top-right-radius: 13px;
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 12px; flex-wrap: wrap;
      }
      .ts-header-text { min-width: 0; flex: 1 1 320px; }
      .ts-title-row { display: flex; align-items: center; gap: 8px; }
      .ts-title { margin: 0; font-size: 16px; font-weight: 500; color: var(--ts-text); letter-spacing: -0.01em; line-height: 1.3; }
      .ts-subtitle { margin: 4px 0 0; font-size: 12px; color: var(--ts-muted); line-height: 1.5; }
      .ts-header-actions { flex: 0 0 auto; }
 
      .ts-card-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 18px; }
 
      .ts-section-label { font-size: 10px; letter-spacing: 0.08em; color: var(--ts-faint); font-weight: 500; margin-bottom: 8px; text-transform: uppercase; }
      .ts-section-box { border: 1px solid var(--ts-border); border-radius: 10px; padding: 14px; background: var(--ts-paper); }
 
      .ts-advanced-only { display: none; }
      .ts-card.ts-expanded .ts-advanced-only { display: block; }
      .ts-card.ts-expanded .ts-reset-footer { display: flex; }
 
      .ts-field-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .ts-field { min-width: 0; }
      .ts-field-label-row { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }
      .ts-field-label { font-size: 11px; color: var(--ts-muted); line-height: 1.3; }
      .ts-input {
        width: 100%; min-height: 34px; padding: 7px 10px;
        border: 1px solid var(--ts-input-border); border-radius: 7px;
        font-size: 13px; background: var(--ts-paper); color: var(--ts-text);
        font-family: inherit; font-variant-numeric: tabular-nums;
        outline: none; transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .ts-input:hover { border-color: var(--ts-input-border-hover); }
      .ts-input:focus { border-color: var(--ts-green); box-shadow: 0 0 0 3px rgba(66, 165, 92, 0.14); }
 
      .ts-help {
        position: relative; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 50%; border: 1px solid var(--ts-input-border-hover);
        background: transparent; color: var(--ts-faint);
        font-weight: 500; line-height: 1; cursor: help; user-select: none; outline: none;
        transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
      }
      .ts-help-sm { width: 13px; height: 13px; font-size: 9px; }
      .ts-help-lg { width: 16px; height: 16px; font-size: 10px; }
      .ts-help:hover, .ts-help:focus { background: var(--ts-green); color: #ffffff; border-color: var(--ts-green); }
 
      .ts-tooltip {
        position: absolute; left: 50%; bottom: calc(100% + 8px); width: 220px;
        padding: 8px 10px; background: var(--ts-tooltip-bg); color: #fff;
        border-radius: 7px; font-size: 11.5px; font-weight: 400; line-height: 1.45;
        text-align: left; cursor: default;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); z-index: 50;
        opacity: 0; pointer-events: none;
        transform: translateX(-50%) translateY(-4px);
        transition: opacity 140ms ease, transform 140ms ease;
      }
      .ts-tooltip::after {
        content: ''; position: absolute; left: 50%; top: 100%; transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 5px solid transparent; border-right: 5px solid transparent;
        border-top: 5px solid var(--ts-tooltip-bg);
      }
      .ts-help:hover .ts-tooltip, .ts-help:focus .ts-tooltip {
        opacity: 1; transform: translateX(-50%) translateY(0);
      }
 
      .ts-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        border: none; background: transparent; color: var(--ts-text);
        font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
        padding: 6px 12px; border-radius: 6px;
        transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 80ms ease;
      }
      .ts-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .ts-btn:active:not(:disabled) { transform: translateY(1px); }
      .ts-btn-pill { border-radius: 999px; padding: 6px 14px; border: 1px solid var(--ts-green-soft); color: var(--ts-green); }
      .ts-btn-pill:hover:not(:disabled) { background: var(--ts-green-bg); border-color: var(--ts-green); }
      .ts-btn-quiet { border-color: var(--ts-input-border-hover); color: var(--ts-muted); }
      .ts-btn-quiet:hover:not(:disabled) { background: var(--ts-cream); border-color: var(--ts-muted); color: var(--ts-text); }
 
      .ts-btn-toggle { white-space: nowrap; }
      .ts-toggle-label-open { display: inline; }
      .ts-toggle-label-close { display: none; }
      .ts-card.ts-expanded .ts-toggle-label-open { display: none; }
      .ts-card.ts-expanded .ts-toggle-label-close { display: inline; }
      .ts-toggle-chevron { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; transition: transform 220ms ease; }
      .ts-toggle-chevron svg { width: 100%; height: 100%; display: block; }
      .ts-card.ts-expanded .ts-toggle-chevron { transform: rotate(180deg); }
 
      .ts-reset-footer { display: none; justify-content: flex-end; padding-top: 6px; }
      .ts-btn-reset { font-size: 11.5px; }
 
      @media (max-width: 700px) {
        .ts-card-header { padding: 16px; }
        .ts-card-body { padding: 16px; }
      }
    `;
    document.head.appendChild(s);
  }
 
  window.TicketSalesSettingsComponent = {
    mount: mount,
    defaults: clone(DEFAULT_TICKET_SALES_RULES)
  };
})();