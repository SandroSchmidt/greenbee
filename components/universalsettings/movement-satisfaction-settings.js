/*
  MovementSatisfactionSettingsComponent
  -----------------------------------------
  Vanilla JS admin UI for configuring movement and satisfaction rules.

  Usage:
    const ui = MovementSatisfactionSettingsComponent.mount(
      '#movement-satisfaction-settings-mount',
      globalSettings.baseRules.movementSatisfaction
    );

    // Save: globalSettings.baseRules.movementSatisfaction = ui.getData();

  Data shape (exactly the shape getData() returns):
  {
    simulation: { entryGateCount, simulationSteps, fallbackGateTile },
    suitabilityNet: { emptySquareSuitability: [n,n,n], emptySquareEffectPower, emptySquareAbsorptionPower },
    movement: { includeCurrentSquareAsCandidate, minMovementSuitability,
                currentSquareStayMultiplier, revisitPenaltyMultiplier },
    visitors: { finalGroupSatisfactionFloor, satisfactionSaturationPower, satisfactionSaturationK },
    vendors: {
      vectorMatching: { negativeSuitabilityFloor, zeroVectorSimilarity },
      visits: { satisfactionSaturationPower, satisfactionSaturationK }
    }
  }
*/
(function () {
  var STYLE_ID = 'movement-satisfaction-settings-style';

  var DEFAULT_RULES = {
    simulation: {
      entryGateCount: 6,
      simulationSteps: 20,
      fallbackGateTile: 'A1'
    },
    suitabilityNet: {
      emptySquareSuitability: [0, 0, 0],
      emptySquareEffectPower: 1,
      emptySquareAbsorptionPower: 0
    },
    movement: {
      includeCurrentSquareAsCandidate: true,
      minMovementSuitability: 0,
      currentSquareStayMultiplier: 0.5,
      revisitPenaltyMultiplier: 0.66
    },
    visitors: {
      finalGroupSatisfactionFloor: 0,
      satisfactionSaturationPower: 1,
      satisfactionSaturationK: 1
    },
    vendors: {
      vectorMatching: { negativeSuitabilityFloor: 0, zeroVectorSimilarity: 0 },
      visits: { satisfactionSaturationPower: 2, satisfactionSaturationK: 200 }
    }
  };

  var HEADER_DESC = 'Configure how visitors move across the board and how visitor and vendor satisfaction is calculated from the simulation.';

  var FIELD_GROUPS = [
    {
      id: 'simulation', advanced: false, label: 'SIMULATION',
      description: 'Controls how visitors enter the board and how long the event movement simulation runs.',
      fields: [
        { path: 'simulation.entryGateCount', label: 'Entry gate count', min: 1, step: 1,
          description: 'How many random entry gates are selected from free edge tiles. Higher values spread visitors across more entrance points; lower values make visitor flow more concentrated.' },
        { path: 'simulation.simulationSteps', label: 'Simulation steps', min: 1, step: 1,
          description: 'How many movement steps each visitor takes during the event simulation. Higher values make visitors explore more of the board; lower values make satisfaction depend more on entry location and nearby objects.' },
        { path: 'simulation.fallbackGateTile', label: 'Fallback gate tile', type: 'text',
          description: 'Tile used as the fallback entrance if there are no free edge tiles available.' }
      ]
    },
    {
      id: 'suitabilityNet', advanced: true, label: 'SUITABILITY NET',
      description: 'Controls default values for empty squares in the board suitability map. Normal object suitability, effect decay, and absorption are still defined per object in object settings.',
      fields: [
        { path: 'suitabilityNet.emptySquareSuitability', label: 'Empty square suitability', type: 'vector3', step: 0.1,
          description: 'Default suitability vector for empty squares. Usually should stay [0, 0, 0], meaning empty tiles do not directly attract or satisfy visitors.' },
        { path: 'suitabilityNet.emptySquareEffectPower', label: 'Empty square effect power', min: 0, step: 0.1,
          description: 'Effect power assigned to empty squares. Since empty squares usually have zero suitability, this normally does not create attraction by itself, but keeps the empty-square data shape consistent with normal objects.' },
        { path: 'suitabilityNet.emptySquareAbsorptionPower', label: 'Empty square absorption power', min: 0, step: 0.1,
          description: 'Absorption assigned to empty squares. Current value 0 means empty squares do not block or weaken suitability flow passing through them.' }
      ]
    },
    {
      id: 'movement', advanced: true, label: 'MOVEMENT',
      description: 'Controls how simulated visitors choose their next square. Visitors choose between the current square and nearby squares using suitability-based weights. Negative movement suitability is treated as non-attractive, and if every candidate has 0 weight, the logic falls back to a random candidate.',
      fields: [
        { path: 'movement.includeCurrentSquareAsCandidate', label: 'Include current square as candidate', type: 'boolean',
          description: 'Whether visitors are allowed to stay on their current square instead of moving. Current logic includes the current square as a possible choice.' },
        { path: 'movement.minMovementSuitability', label: 'Min movement suitability', step: 0.05,
          description: 'Minimum net suitability used when calculating movement weights. Current value 0 means negative net suitability does not attract visitors; it is treated as zero.' },
        { path: 'movement.currentSquareStayMultiplier', label: 'Current square stay multiplier', min: 0, step: 0.05,
          description: "Penalty applied to the current square's movement weight. Lower values make visitors less likely to stay still; higher values make visitors more likely to remain in place." },
        { path: 'movement.revisitPenaltyMultiplier', label: 'Revisit penalty multiplier', min: 0, step: 0.05,
          description: 'Compounding penalty applied each time a visitor has already visited a square. Lower values make visitors avoid repeat visits more strongly; higher values allow more repeated movement.' }
      ]
    },
    {
      id: 'visitors', advanced: true, label: 'VISITORS',
      description: "Controls how visitor satisfaction is calculated from the raw suitability of the squares they visit. Positive suitability creates positive satisfaction, negative suitability creates negative satisfaction, then each person's average is calculated and group averages are floored at the configured minimum.",
      fields: [
        { path: 'visitors.finalGroupSatisfactionFloor', label: 'Final group satisfaction floor', step: 0.05,
          description: 'Minimum final satisfaction value returned for each visitor group. Current value 0 means negative experiences can reduce the average, but the final reported group satisfaction cannot go below zero.' },
        { path: 'visitors.satisfactionSaturationPower', label: 'Satisfaction saturation power', min: 0, step: 0.1,
          description: 'Power used in the signed visitor satisfaction saturation curve. Higher values make both positive and negative satisfaction grow more slowly from small suitability values.' },
        { path: 'visitors.satisfactionSaturationK', label: 'Satisfaction saturation K', min: 0, step: 0.1,
          description: 'Saturation K used in the signed visitor satisfaction curve. Higher values require stronger positive or negative suitability to create a strong satisfaction effect; lower values make satisfaction react faster.' }
      ]
    },
    {
      id: 'vendors', advanced: true, label: 'VENDORS', custom: 'vendors',
      description: "Controls how rented booth vendor satisfaction is calculated. Vendor satisfaction is based on two things: whether the visitor mix matches the vendor's preferred group mix, and how many total visitors reached the booth. The current logic multiplies those two scores and then averages across rented booths."
    }
  ];

  var VENDOR_SUBSECTIONS = [
    {
      title: 'Vector matching',
      description: "Controls how the vendor's preferred visitor mix is compared with the actual visitor mix that reached the booth.",
      fields: [
        { path: 'vendors.vectorMatching.negativeSuitabilityFloor', label: 'Negative suitability floor', step: 0.05,
          description: 'Minimum value used when normalizing vendor suitability vectors. Current value 0 means negative vendor suitability is treated as zero before comparing visitor mix.' },
        { path: 'vendors.vectorMatching.zeroVectorSimilarity', label: 'Zero vector similarity', min: 0, step: 0.05,
          description: 'Similarity score returned when either vector has no usable magnitude. Current value 0 means a vendor gets no visitor-mix match score if either expected or actual visitor mix cannot be compared.' }
      ]
    },
    {
      title: 'Visits',
      description: 'Controls how total booth visits are converted into the traffic part of vendor satisfaction.',
      fields: [
        { path: 'vendors.visits.satisfactionSaturationPower', label: 'Satisfaction saturation power', min: 0, step: 0.1,
          description: 'Power used when converting total booth visits into vendor visit satisfaction. Higher values make vendors require stronger traffic before they feel satisfied.' },
        { path: 'vendors.visits.satisfactionSaturationK', label: 'Satisfaction saturation K', min: 0, step: 1,
          description: 'Saturation K used for booth visit satisfaction. Higher values mean vendors need more visits to reach high satisfaction; lower values make fewer visits enough.' }
      ]
    }
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
    b.className = cls || 'ms-btn';
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
  function enforceRanges(d) {
    d.simulation.entryGateCount = Math.max(1, Math.round(Number(d.simulation.entryGateCount || 1)));
    d.simulation.simulationSteps = Math.max(1, Math.round(Number(d.simulation.simulationSteps || 1)));
    d.simulation.fallbackGateTile = String(d.simulation.fallbackGateTile == null ? 'A1' : d.simulation.fallbackGateTile);

    if (!Array.isArray(d.suitabilityNet.emptySquareSuitability)) d.suitabilityNet.emptySquareSuitability = [0, 0, 0];
    d.suitabilityNet.emptySquareSuitability = [0, 1, 2].map(function (i) {
      return Number(d.suitabilityNet.emptySquareSuitability[i] || 0);
    });
    d.suitabilityNet.emptySquareEffectPower = Math.max(0, Number(d.suitabilityNet.emptySquareEffectPower || 0));
    d.suitabilityNet.emptySquareAbsorptionPower = Math.max(0, Number(d.suitabilityNet.emptySquareAbsorptionPower || 0));

    d.movement.includeCurrentSquareAsCandidate = !!d.movement.includeCurrentSquareAsCandidate;
    d.movement.currentSquareStayMultiplier = Math.max(0, Number(d.movement.currentSquareStayMultiplier || 0));
    d.movement.revisitPenaltyMultiplier = Math.max(0, Number(d.movement.revisitPenaltyMultiplier || 0));

    d.visitors.satisfactionSaturationPower = Math.max(0, Number(d.visitors.satisfactionSaturationPower || 0));
    d.visitors.satisfactionSaturationK = Math.max(0, Number(d.visitors.satisfactionSaturationK || 0));

    d.vendors.vectorMatching.zeroVectorSimilarity = Math.max(0, Number(d.vendors.vectorMatching.zeroVectorSimilarity || 0));
    d.vendors.visits.satisfactionSaturationPower = Math.max(0, Number(d.vendors.visits.satisfactionSaturationPower || 0));
    d.vendors.visits.satisfactionSaturationK = Math.max(0, Number(d.vendors.visits.satisfactionSaturationK || 0));
  }

  // ---------- Mount ----------
  function mount(selectorOrElement, initialData, options) {
    var root = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
    if (!root) throw new Error('MovementSatisfactionSettingsComponent: mount element not found.');

    injectStyles();

    var config = Object.assign({
      title: 'Movement and satisfaction settings',
      initiallyExpanded: false
    }, options || {});

    var state = mergeDefaults(DEFAULT_RULES, sanitizeInitialData(initialData));
    var isAdvancedOpen = !!config.initiallyExpanded;
    var syncFns = new Map(); // path -> function(value)

    render();

    function render() {
      syncFns.clear();
      root.innerHTML = '';
      root.classList.add('ms-root');

      var card = el('section', 'ms-card');
      if (isAdvancedOpen) card.classList.add('ms-expanded');
      card.appendChild(renderHeader());
      card.appendChild(renderBody());
      root.appendChild(card);

      syncAllInputsFromState();
    }

    function renderHeader() {
      var h = el('header', 'ms-card-header');
      var text = el('div', 'ms-header-text');
      var titleRow = el('div', 'ms-title-row');
      titleRow.appendChild(el('h3', 'ms-title', config.title));
      titleRow.appendChild(renderHelp(HEADER_DESC, 'lg'));
      text.appendChild(titleRow);
      text.appendChild(el('p', 'ms-subtitle', HEADER_DESC));

      var actions = el('div', 'ms-header-actions');
      var toggle = button('', 'ms-btn ms-btn-pill ms-btn-toggle');
      toggle.innerHTML =
        '<span class="ms-toggle-label-open">Advanced settings</span>' +
        '<span class="ms-toggle-label-close">Hide advanced</span>' +
        '<span class="ms-toggle-chevron">' + CHEVRON_SVG + '</span>';
      toggle.setAttribute('aria-expanded', isAdvancedOpen ? 'true' : 'false');
      toggle.addEventListener('click', function () {
        isAdvancedOpen = !isAdvancedOpen;
        var c = root.querySelector('.ms-card');
        if (c) c.classList.toggle('ms-expanded', isAdvancedOpen);
        toggle.setAttribute('aria-expanded', isAdvancedOpen ? 'true' : 'false');
      });
      actions.appendChild(toggle);

      h.appendChild(text);
      h.appendChild(actions);
      return h;
    }

    function renderBody() {
      var body = el('div', 'ms-card-body');
      FIELD_GROUPS.forEach(function (g) {
        var s = renderSection(g);
        if (g.advanced) s.classList.add('ms-advanced-only');
        body.appendChild(s);
      });
      body.appendChild(renderResetFooter());
      return body;
    }

    function renderSection(g) {
      var s = el('div', 'ms-section');
      s.dataset.sectionId = g.id;

      var labelRow = el('div', 'ms-section-label-row');
      labelRow.appendChild(el('span', 'ms-section-label', g.label));
      if (g.description) labelRow.appendChild(renderHelp(g.description, 'sm'));
      s.appendChild(labelRow);

      var box = el('div', 'ms-section-box');
      if (g.custom === 'vendors') {
        renderVendorsInto(box);
      } else if (Array.isArray(g.fields)) {
        var grid = el('div', 'ms-field-grid');
        g.fields.forEach(function (f) { grid.appendChild(renderField(f)); });
        box.appendChild(grid);
      }
      s.appendChild(box);
      return s;
    }

    function renderVendorsInto(box) {
      VENDOR_SUBSECTIONS.forEach(function (sub, i) {
        var subEl = el('div', 'ms-subsection');
        if (i > 0) subEl.classList.add('ms-subsection-spaced');

        var titleRow = el('div', 'ms-subsection-title-row');
        titleRow.appendChild(el('span', 'ms-subsection-title', sub.title));
        titleRow.appendChild(renderHelp(sub.description, 'sm'));
        subEl.appendChild(titleRow);

        var grid = el('div', 'ms-field-grid');
        sub.fields.forEach(function (f) { grid.appendChild(renderField(f)); });
        subEl.appendChild(grid);

        box.appendChild(subEl);
      });
    }

    // ---------- Field dispatch ----------
    function renderField(field) {
      if (field.type === 'boolean') return renderBooleanField(field);
      if (field.type === 'vector3') return renderVector3Field(field);
      if (field.type === 'text') return renderTextField(field);
      return renderNumberField(field);
    }

    function renderFieldLabel(field) {
      var lr = el('div', 'ms-field-label-row');
      lr.appendChild(el('label', 'ms-field-label', field.label));
      if (field.description) lr.appendChild(renderHelp(field.description, 'sm'));
      return lr;
    }

    function renderNumberField(field) {
      var w = el('div', 'ms-field');
      w.appendChild(renderFieldLabel(field));
      var input = document.createElement('input');
      input.className = 'ms-input';
      input.type = 'number';
      input.step = String(field.step == null ? 1 : field.step);
      if (field.min !== undefined) input.min = String(field.min);
      if (field.max !== undefined) input.max = String(field.max);
      input.addEventListener('input', function () {
        var parsed = parseInputValue(input.value, getByPath(DEFAULT_RULES, field.path));
        setByPath(state, field.path, parsed);
        emitChange();
      });
      syncFns.set(field.path, function (v) {
        input.value = v === undefined || v === null ? '' : String(v);
      });
      w.appendChild(input);
      return w;
    }

    function renderTextField(field) {
      var w = el('div', 'ms-field');
      w.appendChild(renderFieldLabel(field));
      var input = document.createElement('input');
      input.className = 'ms-input';
      input.type = 'text';
      input.addEventListener('input', function () {
        setByPath(state, field.path, input.value);
        emitChange();
      });
      syncFns.set(field.path, function (v) {
        input.value = v == null ? '' : String(v);
      });
      w.appendChild(input);
      return w;
    }

    function renderVector3Field(field) {
      var w = el('div', 'ms-field');
      w.appendChild(renderFieldLabel(field));
      var inputs = el('div', 'ms-vector3-inputs');
      var inputEls = [];
      [0, 1, 2].forEach(function (idx) {
        var inp = document.createElement('input');
        inp.className = 'ms-input ms-vector3-input';
        inp.type = 'number';
        inp.step = String(field.step == null ? 0.1 : field.step);
        if (field.min !== undefined) inp.min = String(field.min);
        inp.addEventListener('input', function () {
          var cur = getByPath(state, field.path);
          if (!Array.isArray(cur)) cur = [0, 0, 0];
          cur = cur.slice();
          cur[idx] = parseInputValue(inp.value, 0);
          setByPath(state, field.path, cur);
          emitChange();
        });
        inputs.appendChild(inp);
        inputEls.push(inp);
      });
      syncFns.set(field.path, function (v) {
        var arr = Array.isArray(v) ? v : [0, 0, 0];
        inputEls.forEach(function (inp, i) {
          inp.value = arr[i] == null ? '' : String(arr[i]);
        });
      });
      w.appendChild(inputs);
      return w;
    }

    function renderBooleanField(field) {
      var w = el('div', 'ms-field ms-field-boolean');
      var labelWrap = el('div', 'ms-field-boolean-label');
      labelWrap.appendChild(renderFieldLabel(field));

      var toggle = document.createElement('button');
      toggle.className = 'ms-switch';
      toggle.type = 'button';
      toggle.setAttribute('role', 'switch');
      var knob = el('span', 'ms-switch-knob');
      toggle.appendChild(knob);

      toggle.addEventListener('click', function () {
        var newVal = !getByPath(state, field.path);
        setByPath(state, field.path, newVal);
        applyBoolUI(newVal);
        emitChange();
      });

      function applyBoolUI(v) {
        var b = !!v;
        toggle.setAttribute('data-on', b ? 'true' : 'false');
        toggle.setAttribute('aria-checked', b ? 'true' : 'false');
      }
      syncFns.set(field.path, applyBoolUI);

      w.appendChild(labelWrap);
      w.appendChild(toggle);
      return w;
    }

    function renderHelp(text, size) {
      var w = el('span', 'ms-help ms-help-' + (size || 'sm'));
      w.tabIndex = 0;
      w.setAttribute('role', 'button');
      w.setAttribute('aria-label', text);
      w.textContent = '?';
      var tip = el('span', 'ms-tooltip');
      tip.textContent = text;
      w.appendChild(tip);
      return w;
    }

    function renderResetFooter() {
      var f = el('div', 'ms-reset-footer ms-advanced-only');
      var b = button('Reset all to defaults', 'ms-btn ms-btn-pill ms-btn-quiet ms-btn-reset');
      b.addEventListener('click', function () {
        if (!window.confirm('Reset movement and satisfaction settings to default values?')) return;
        state = clone(DEFAULT_RULES);
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
      var c = root.querySelector('.ms-card');
      if (c) c.classList.toggle('ms-expanded', isAdvancedOpen);
    }

    function syncAllInputsFromState() {
      syncFns.forEach(function (fn, path) { fn(getByPath(state, path)); });
    }

    function emitChange() {
      root.dispatchEvent(new CustomEvent('movementSatisfactionSettingsChange', { detail: clone(state), bubbles: true }));
    }

    return {
      getData: function () { var c = clone(state); enforceRanges(c); return c; },
      setData: function (d) { state = mergeDefaults(DEFAULT_RULES, sanitizeInitialData(d)); rerender(); emitChange(); },
      destroy: function () { root.innerHTML = ''; root.classList.remove('ms-root'); syncFns.clear(); },
      getDefaults: function () { return clone(DEFAULT_RULES); }
    };
  }

  // ---------- Styles ----------
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .ms-root { width: 100%; }
      .ms-root, .ms-root * { box-sizing: border-box; }
      .ms-card {
        --ms-cream:#fbfaf3; --ms-paper:#ffffff; --ms-border:#ece9dd; --ms-border-soft:#f3f1e7;
        --ms-mint:#f1f6e8;
        --ms-text:#1a1a1a; --ms-muted:#6b6b6b; --ms-faint:#a0a09a;
        --ms-input-border:#d8d5cc; --ms-input-border-hover:#c8c5b8;
        --ms-green:#42a55c; --ms-green-soft:#a4d294; --ms-green-bg:#e6f4dc;
        --ms-track:#d8d5cc;
        --ms-tooltip-bg:#2a2a28;
        background: var(--ms-paper); border: 1px solid var(--ms-border); border-radius: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: var(--ms-text); font-size: 13px; line-height: 1.5;
        -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
      }
      .ms-card-header {
        background: var(--ms-mint); padding: 18px 20px;
        border-bottom: 1px solid var(--ms-border);
        border-top-left-radius: 13px; border-top-right-radius: 13px;
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 12px; flex-wrap: wrap;
      }
      .ms-header-text { min-width: 0; flex: 1 1 320px; }
      .ms-title-row { display: flex; align-items: center; gap: 8px; }
      .ms-title { margin: 0; font-size: 16px; font-weight: 500; color: var(--ms-text); letter-spacing: -0.01em; line-height: 1.3; }
      .ms-subtitle { margin: 4px 0 0; font-size: 12px; color: var(--ms-muted); line-height: 1.5; }
      .ms-header-actions { flex: 0 0 auto; }

      .ms-card-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 18px; }

      .ms-section-label-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
      .ms-section-label { font-size: 10px; letter-spacing: 0.08em; color: var(--ms-faint); font-weight: 500; text-transform: uppercase; }
      .ms-section-box { border: 1px solid var(--ms-border); border-radius: 10px; padding: 14px; background: var(--ms-paper); }

      .ms-advanced-only { display: none; }
      .ms-card.ms-expanded .ms-advanced-only { display: block; }
      .ms-card.ms-expanded .ms-reset-footer { display: flex; }

      .ms-field-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .ms-field { min-width: 0; }
      .ms-field-label-row { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }
      .ms-field-label { font-size: 11px; color: var(--ms-muted); line-height: 1.3; }
      .ms-input {
        width: 100%; min-height: 34px; padding: 7px 10px;
        border: 1px solid var(--ms-input-border); border-radius: 7px;
        font-size: 13px; background: var(--ms-paper); color: var(--ms-text);
        font-family: inherit; font-variant-numeric: tabular-nums;
        outline: none; transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .ms-input:hover { border-color: var(--ms-input-border-hover); }
      .ms-input:focus { border-color: var(--ms-green); box-shadow: 0 0 0 3px rgba(66, 165, 92, 0.14); }

      /* Vector3 field: three inputs side by side */
      .ms-vector3-inputs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
      .ms-vector3-input { text-align: center; padding-left: 6px; padding-right: 6px; }

      /* Boolean field: label on the left, toggle switch on the right */
      .ms-field-boolean {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; padding: 4px 0;
      }
      .ms-field-boolean-label { flex: 1 1 auto; min-width: 0; }
      .ms-field-boolean .ms-field-label-row { margin-bottom: 0; }

      .ms-switch {
        position: relative; display: inline-flex; align-items: center;
        width: 38px; height: 22px; padding: 0; border: none;
        border-radius: 999px; background: var(--ms-track);
        cursor: pointer; flex-shrink: 0;
        transition: background-color 160ms ease;
      }
      .ms-switch[data-on="true"] { background: var(--ms-green); }
      .ms-switch:focus { outline: none; box-shadow: 0 0 0 3px rgba(66, 165, 92, 0.18); }
      .ms-switch-knob {
        position: absolute; top: 2px; left: 2px;
        width: 18px; height: 18px; border-radius: 50%;
        background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        transition: transform 200ms ease;
      }
      .ms-switch[data-on="true"] .ms-switch-knob { transform: translateX(16px); }

      /* Subsection (used inside vendors) */
      .ms-subsection-spaced { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--ms-border-soft); }
      .ms-subsection-title-row { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
      .ms-subsection-title { font-size: 13px; font-weight: 500; color: var(--ms-text); letter-spacing: -0.005em; }

      /* Help icon + tooltip */
      .ms-help {
        position: relative; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 50%; border: 1px solid var(--ms-input-border-hover);
        background: transparent; color: var(--ms-faint);
        font-weight: 500; line-height: 1; cursor: help; user-select: none; outline: none;
        transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
      }
      .ms-help-sm { width: 13px; height: 13px; font-size: 9px; }
      .ms-help-lg { width: 16px; height: 16px; font-size: 10px; }
      .ms-help:hover, .ms-help:focus { background: var(--ms-green); color: #ffffff; border-color: var(--ms-green); }

      .ms-tooltip {
        position: absolute; left: 50%; bottom: calc(100% + 8px); width: 240px;
        padding: 8px 10px; background: var(--ms-tooltip-bg); color: #fff;
        border-radius: 7px; font-size: 11.5px; font-weight: 400; line-height: 1.45;
        text-align: left; cursor: default;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); z-index: 50;
        opacity: 0; pointer-events: none;
        transform: translateX(-50%) translateY(-4px);
        transition: opacity 140ms ease, transform 140ms ease;
      }
      .ms-tooltip::after {
        content: ''; position: absolute; left: 50%; top: 100%; transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 5px solid transparent; border-right: 5px solid transparent;
        border-top: 5px solid var(--ms-tooltip-bg);
      }
      .ms-help:hover .ms-tooltip, .ms-help:focus .ms-tooltip {
        opacity: 1; transform: translateX(-50%) translateY(0);
      }

      /* Buttons */
      .ms-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        border: none; background: transparent; color: var(--ms-text);
        font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
        padding: 6px 12px; border-radius: 6px;
        transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 80ms ease;
      }
      .ms-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .ms-btn:active:not(:disabled) { transform: translateY(1px); }
      .ms-btn-pill { border-radius: 999px; padding: 6px 14px; border: 1px solid var(--ms-green-soft); color: var(--ms-green); }
      .ms-btn-pill:hover:not(:disabled) { background: var(--ms-green-bg); border-color: var(--ms-green); }
      .ms-btn-quiet { border-color: var(--ms-input-border-hover); color: var(--ms-muted); }
      .ms-btn-quiet:hover:not(:disabled) { background: var(--ms-cream); border-color: var(--ms-muted); color: var(--ms-text); }

      .ms-btn-toggle { white-space: nowrap; }
      .ms-toggle-label-open { display: inline; }
      .ms-toggle-label-close { display: none; }
      .ms-card.ms-expanded .ms-toggle-label-open { display: none; }
      .ms-card.ms-expanded .ms-toggle-label-close { display: inline; }
      .ms-toggle-chevron { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; transition: transform 220ms ease; }
      .ms-toggle-chevron svg { width: 100%; height: 100%; display: block; }
      .ms-card.ms-expanded .ms-toggle-chevron { transform: rotate(180deg); }

      .ms-reset-footer { display: none; justify-content: flex-end; padding-top: 6px; }
      .ms-btn-reset { font-size: 11.5px; }

      @media (max-width: 700px) {
        .ms-card-header { padding: 16px; }
        .ms-card-body { padding: 16px; }
      }
    `;
    document.head.appendChild(s);
  }

  window.MovementSatisfactionSettingsComponent = {
    mount: mount,
    defaults: clone(DEFAULT_RULES)
  };
})();
