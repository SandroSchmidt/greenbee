/*
  VendorOffersSettingsComponent
  -----------------------------------------
  Vanilla JS admin UI for configuring vendor offer generation rules.

  Usage:
    const ui = VendorOffersSettingsComponent.mount(
      '#vendor-offers-settings-mount',
      globalSettings.baseRules.vendorOffers,
      { objects: globalSettings.objects } // Record<id, {icon, color, ...}> OR array of { id, ... }
    );

    // Save: globalSettings.baseRules.vendorOffers = ui.getData();

  All field tooltips show the placeholder string "Popup content" — fill them
  in per-field by adding `description: '...'` to the entry in FIELD_GROUPS.

  Data shape (exactly the shape getData() returns):
  {
    maxOffersPerTile, maxTotalOffers, roundPriceTo,
    offerCount: { randomBaseMin, randomBaseMax, demandMultiplier,
                  salesTeamExtraOffersFrom, salesTeamExtraOffersTo,
                  weights: { ticketSales, salesEfficiency, marketing, proximity } },
    offerPrice: { ticketSalesMinMultiplier, ticketSalesBonusRange,
                  salesEfficiencyMinMultiplier, salesEfficiencyBonusRange,
                  marketingMinMultiplier, marketingBonusRange,
                  salesTeamMultiplierFrom, salesTeamMultiplierTo,
                  marketNoiseFrom, marketNoiseTo },
    proximity: { minMultiplier, maxMultiplier,
                 penalties: [{ object, value }, ...],
                 bonuses:   [{ object, value }, ...],
                 genericObjectBonusStrength, genericObjectSaturationK },
    marketing: { saturationK, websiteBoostFromPercent, websiteBoostToPercent },
    vendorSuitability: { regularFrom, regularTo, premiumFrom, premiumTo }
  }
*/
(function () {
  var STYLE_ID = 'vendor-offers-settings-style';
  var PLACEHOLDER_DESC = 'Popup content';

  /*var DEFAULT_VENDOR_OFFERS_SETTINGS = {
    maxOffersPerTile: 5,
    maxTotalOffers: 12,
    roundPriceTo: 10,
    offerCount: {
      randomBaseMin: 0,
      randomBaseMax: 1.25,
      demandMultiplier: 3,
      salesTeamExtraOffersFrom: 1,
      salesTeamExtraOffersTo: 3,
      weights: { ticketSales: 0.30, salesEfficiency: 0.20, marketing: 0.35, proximity: 0.15 }
    },
    offerPrice: {
      baseBoothsPriceAdjustmentFrom: -10, baseBoothsPriceAdjustmentFrom:15,
      ticketSalesMinMultiplier: 0.85, ticketSalesBonusRange: 0.5,
      salesEfficiencyMinMultiplier: 0.6, salesEfficiencyBonusRange: 0.8,
      marketingMinMultiplier: 0.6, marketingBonusRange: 0.8,
      salesTeamMultiplierFrom: 1.2, salesTeamMultiplierTo: 1.5,
      marketNoiseFrom: 0.9, marketNoiseTo: 1.2
    },
    proximity: {
      minMultiplier: 0.55,
      maxMultiplier: 1.75,
      penalties: [],
      bonuses: [],
      genericObjectBonusStrength: 0.16,
      genericObjectSaturationK: 30
    },
    marketing: { saturationK: 50, websiteBoostFromPercent: 12, websiteBoostToPercent: 25 },
    vendorSuitability: { regularFrom: 1, regularTo: 9, premiumFrom: 5, premiumTo: 15 }
  };*/

  var DEFAULT_VENDOR_OFFERS_SETTINGS = {
  maxOffersPerTile: 5,
  maxTotalOffers: 12,
  roundPriceTo: 10,

  offerCount: {
    randomBaseMin: 0,
    randomBaseMax: 1.25,
    demandMultiplier: 3,
    salesTeamExtraOffersFrom: 1,
    salesTeamExtraOffersTo: 3,
    weights: {
      ticketSales: 0.30,
      salesEfficiency: 0.20,
      marketing: 0.35,
      proximity: 0.15,
    },
  },

  offerPrice: {
    baseBoothsPriceAdjustmentFrom: -10,
    baseBoothsPriceAdjustmentTo: 15,

    ticketSalesMinMultiplier: 0.85,
    ticketSalesBonusRange: 0.5,

    salesEfficiencyMinMultiplier: 0.6,
    salesEfficiencyBonusRange: 0.8,

    marketingMinMultiplier: 0.6,
    marketingBonusRange: 0.8,

    salesTeamMultiplierFrom: 1.2,
    salesTeamMultiplierTo: 1.5,

    marketNoiseFrom: 0.9,
    marketNoiseTo: 1.2,
  },

  proximity: {
    minMultiplier: 0.55,
    maxMultiplier: 1.75,
    penalties: [],
    bonuses: [],
    genericObjectBonusStrength: 0.16,
    genericObjectSaturationK: 30,
  },

  marketing: {
    saturationK: 50,
    websiteBoostFromPercent: 12,
    websiteBoostToPercent: 25,
  },

  vendorSuitability: {
    regularFrom: 1,
    regularTo: 9,
    premiumFrom: 5,
    premiumTo: 15,
  },
};

  // Add `description: '...'` to any field to override the placeholder tooltip.
  var FIELD_GROUPS = [
    { id: 'main', advanced: false, label: 'MAIN LIMITS', fields: [
      { 
        path: 'maxOffersPerTile', 
        label: 'Max offers per booth', 
        description: `Maximum number of vendor offers that one available booth can receive in a turn.`, 
        min: 0, 
        step: 1 },
      { 
        path: 'maxTotalOffers',
        label: 'Max total vendor offers', 
        description: 'Maximum number of vendor offers shown to the player in one turn, across all booths.',
        min: 0, 
        step: 1,
      },
      { 
        path: 'roundPriceTo', 
        label: 'Round price to nearest',
        description: 'Rounds final vendor offer prices to the nearest selected amount. Example: 10 creates cleaner prices like 120, 250, 430.',
        min: 1, 
        step: 1 
      }
    ]},
    { id: 'offerCount', advanced: true, label: 'OFFER COUNT', description: 'Controls how event demand turns into the number of offers each booth receives.',
      fields: [
      { path: 'offerCount.randomBaseMin', label: 'Base randomness from', step: 0.05, description: 'Lowest random value added when calculating offer count, so results are not fully predictable.' },
      { path: 'offerCount.randomBaseMax', label: 'Base randomness to', step: 0.05, description: 'Highest random value added when calculating offer count. Higher values make offers more luck-based.' },
      { path: 'offerCount.demandMultiplier', label: 'Demand impact on count', min: 0, step: 0.1, description: 'Controls how strongly ticket sales, marketing, sales efficiency, and location increase offer count.' },
      { path: 'offerCount.salesTeamExtraOffersFrom', label: 'Sales team extra offers from', min: 0, step: 1, description: 'Minimum extra vendor offers generated when the player has a sales team.'},
      { path: 'offerCount.salesTeamExtraOffersTo', label: 'Sales team extra offers to', min: 0, step: 1, description: 'Maximum extra vendor offers generated when the player has a sales team.' }
    ]},
    { id: 'weights', advanced: true, label: 'DEMAND WEIGHTS', footer: 'normalize-weights', fields: [
      { path: 'offerCount.weights.ticketSales', label: 'Ticket sales', min: 0, step: 0.01, description:'How much total sold tickets affect vendor interest. Higher values make ticket sales more important.' },
      { path: 'offerCount.weights.salesEfficiency', label: 'Sales efficiency', min: 0, step: 0.01, description: 'How much recent sales performance affects vendor interest.' },
      { path: 'offerCount.weights.marketing', label: 'Marketing', min: 0, step: 0.01, description: 'How much audience interest from marketing affects vendor interest.' },
      { path: 'offerCount.weights.proximity', label: 'Booth location', min: 0, step: 0.01, description: 'How much nearby objects and booth placement affect vendor interest.' }
    ]},
    { id: 'offerPrice', advanced: true, label: 'OFFER PRICE MULTIPLIERS',  description: 'Controls how event performance affects the actual money offered by vendors.',
       fields: [
      { path: 'offerPrice.baseBoothsPriceAdjustmentFrom', label: 'Base Booths Price Adjustment From \u00d7', min: -500, step: 1, description: 'Min value added as adjustment to basePrice value thats used as a starting point for calculating realistic vendor offers for booths on the board. Base price is currently calculated as booth price in catalog plus price variance value. NOTE: This gets overriden if user has hired Sales Team with Vendor Offer Boost feature.' },
      { path: 'offerPrice.baseBoothsPriceAdjustmentTo', label: 'Base Booths Price Adjustment To', min: -500, step: 1, description: 'Max value added as adjustment to basePrice value thats used as a starting point for calculating realistic vendor offers for booths on the board. Base price is currently calculated as booth price in catalog plus price variance value. NOTE: This gets overriden if user has hired Sales Team with Vendor Offer Boost feature.' },
      { path: 'offerPrice.ticketSalesMinMultiplier', label: 'Ticket Sales Price Min Multiplier \u00d7', min: 0, step: 0.05, description: 'Offer price multiplier when ticket sales are very low. Lower values make poor ticket sales hurt vendor prices more.' },
      { path: 'offerPrice.ticketSalesBonusRange', label: 'Ticket Sales Price Bonus Range', min: 0, step: 0.05, description: 'Extra multiplier added as ticket sales improve. Max multiplier is minimum plus this value.' },
      { path: 'offerPrice.salesEfficiencyMinMultiplier', label: 'Sales Efficiency Price Min Multiplier \u00d7', min: 0, step: 0.05, description: 'Offer price multiplier when recent sales efficiency is poor.' },
      { path: 'offerPrice.salesEfficiencyBonusRange', label: 'Sales Efficiency Price Bonus Range', min: 0, step: 0.05, description: 'Extra multiplier added from strong recent sales efficiency.' },
      { path: 'offerPrice.marketingMinMultiplier', label: 'Marketing Price Min Multiplier \u00d7', min: 0, step: 0.05, description: 'Offer price multiplier when marketing interest is low.' },
      { path: 'offerPrice.marketingBonusRange', label: 'Marketing Price Bonus Range', min: 0, step: 0.05, description: 'Extra multiplier added from strong marketing interest.' },
      { path: 'offerPrice.salesTeamMultiplierFrom', label: 'Sales Team Price Boost From', min: 0, step: 0.05, description: 'Minimum price multiplier when the player has a sales team.' },
      { path: 'offerPrice.salesTeamMultiplierTo', label: 'Sales Team Price Boost To', min: 0, step: 0.05, description: 'Maximum price multiplier when the player has a sales team.' },
      { path: 'offerPrice.marketNoiseFrom', label: 'Market Noise From', min: 0, step: 0.05, description: 'Lowest random market variation applied to offer price.' },
      { path: 'offerPrice.marketNoiseTo', label: 'Market Noise To', min: 0, step: 0.05, description: 'Highest random market variation applied to offer price.' },
    ]},
    { id: 'proximity', advanced: true, label: 'BOOTH LOCATION / PROXIMITY', custom: 'proximity', description: 'Controls how nearby objects change the value of a booth location.', },
    { id: 'marketing', advanced: true, label: 'MARKETING AND WEBSITE', 
      description: 'Controls how audience interest and website ownership affect vendor demand.',
      fields: [
        { path: 'marketing.saturationK', label: 'Marketing Saturation K', min: 1, step: 1, description: 'Controls how quickly audience interest turns into vendor interest. Lower values make marketing stronger earlier.' },
        { path: 'marketing.websiteBoostFromPercent', label: 'Website Vendor Interest Boost From (%)', min: 0, step: 1, description: 'Minimum extra vendor interest boost if the player has a website.' },
        { path: 'marketing.websiteBoostToPercent', label: 'Website Vendor Interest Boost To (%)', min: 0, step: 1, description: 'Maximum extra vendor interest boost if the player has a website.' },
      ],},
    { id: 'vendorSuitability', advanced: true, label: 'VENDOR SUITABILITY',
      description: 'Controls how strong generated vendors are for regular and premium booths.',
      fields: [
        { path: 'vendorSuitability.regularFrom', label: 'Regular Vendor Suitability From', min: 1, step: 1, description: 'Minimum total suitability strength for vendors offering to rent regular booths.' },
        { path: 'vendorSuitability.regularTo', label: 'Regular Vendor Suitability To', min: 1, step: 1, description: 'Maximum total suitability strength for vendors offering to rent regular booths.' },
        { path: 'vendorSuitability.premiumFrom', label: 'Premium Vendor Suitability From', min: 1, step: 1, description: 'Minimum total suitability strength for vendors offering to rent premium booths.' },
        { path: 'vendorSuitability.premiumTo', label: 'Premium Vendor Suitability To', min: 1, step: 1, description: 'Maximum total suitability strength for vendors offering to rent premium booths.' },
      ],}
  ];

  // Inline SVG fallbacks used when an object has no `.icon` URL or the URL fails.
  var ICON_SVG = {
    'default':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>',
    'stage':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14a2 2 0 0 0 2-2V5a2 2 0 1 0-4 0v7a2 2 0 0 0 2 2z"/><path d="M7 12a5 5 0 0 0 10 0"/><path d="M12 17v4"/></svg>',
    'shop':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.2 12.5a1 1 0 0 1-1 0.9H7.2a1 1 0 0 1-1-0.9L5 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>',
    'store':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l2-7h14l2 7"/><path d="M3 11v10h18V11"/><path d="M9 21v-5h6v5"/></svg>',
    'decoration': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><circle cx="6" cy="6" r="1.5" fill="currentColor"/><circle cx="18" cy="6" r="1.5" fill="currentColor"/><circle cx="6" cy="18" r="1.5" fill="currentColor"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/></svg>',
    'bar':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l-7 8v7"/><path d="M9 19h6"/></svg>'
  };
  function getFallbackIconSvg(id) {
    var s = String(id || '').toLowerCase();
    if (s.indexOf('stage') >= 0 || s.indexOf('podium') >= 0) return ICON_SVG.stage;
    if (s.indexOf('premium') >= 0 || s.indexOf('vip') >= 0) return ICON_SVG.shop;
    if (s.indexOf('decor') >= 0 || s.indexOf('flag') >= 0 || s.indexOf('plant') >= 0 || s.indexOf('flower') >= 0) return ICON_SVG.decoration;
    if (s.indexOf('bar') >= 0 || s.indexOf('drink') >= 0) return ICON_SVG.bar;
    if (s.indexOf('shop') >= 0 || s.indexOf('store') >= 0 || s.indexOf('stand') >= 0 || s.indexOf('booth') >= 0 || s.indexOf('kiosk') >= 0) return ICON_SVG.store;
    return ICON_SVG['default'];
  }

  var CHEVRON_SVG = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5L7 9L11 5"/></svg>';
  var PLUS_SVG = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6 1.5V10.5M1.5 6H10.5"/></svg>';
  var X_SVG = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"/></svg>';

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
    b.className = cls || 'vo-btn';
    b.type = 'button';
    if (text) b.textContent = text;
    return b;
  }
  function roundNumber(v, d) { var f = Math.pow(10, d); return Math.round(Number(v || 0) * f) / f; }
  function parseInputValue(v, fb) {
    if (v === '') return fb == null ? 0 : fb;
    var n = Number(v); return Number.isFinite(n) ? n : (fb == null ? 0 : fb);
  }
  function humanizeId(id) {
    return String(id || '').replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function normalizeObjects(objs) {
    if (!objs) return {};
    if (Array.isArray(objs)) {
      var map = {};
      objs.forEach(function (o) { if (o && o.id) map[o.id] = o; });
      return map;
    }
    return objs;
  }
  function sanitizeInitialData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    var c = clone(data);
    if (c.proximity && typeof c.proximity === 'object') {
      // strip legacy fixed-object fields
      delete c.proximity.regularStandCompetitionPenalty;
      delete c.proximity.premiumStandCompetitionPenalty;
      delete c.proximity.stageBonus;
      delete c.proximity.decorationBonus;
      c.proximity.penalties = Array.isArray(c.proximity.penalties)
        ? c.proximity.penalties.filter(function (it) { return it && typeof it === 'object' && typeof it.object === 'string'; })
          .map(function (it) { return { object: it.object, value: Math.max(0, Number(it.value) || 0) }; })
        : [];
      c.proximity.bonuses = Array.isArray(c.proximity.bonuses)
        ? c.proximity.bonuses.filter(function (it) { return it && typeof it === 'object' && typeof it.object === 'string'; })
          .map(function (it) { return { object: it.object, value: Math.max(0, Number(it.value) || 0) }; })
        : [];
    }
    return c;
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
    fixFromTo(d, 'offerCount.salesTeamExtraOffersFrom', 'offerCount.salesTeamExtraOffersTo');
    fixFromTo(d, 'offerPrice.salesTeamMultiplierFrom', 'offerPrice.salesTeamMultiplierTo');
    fixFromTo(d, 'offerPrice.marketNoiseFrom', 'offerPrice.marketNoiseTo');
    fixFromTo(d, 'proximity.minMultiplier', 'proximity.maxMultiplier');
    fixFromTo(d, 'marketing.websiteBoostFromPercent', 'marketing.websiteBoostToPercent');
    fixFromTo(d, 'vendorSuitability.regularFrom', 'vendorSuitability.regularTo');
    fixFromTo(d, 'vendorSuitability.premiumFrom', 'vendorSuitability.premiumTo');
    d.maxOffersPerTile = Math.max(0, Math.round(Number(d.maxOffersPerTile || 0)));
    d.maxTotalOffers = Math.max(0, Math.round(Number(d.maxTotalOffers || 0)));
    d.roundPriceTo = Math.max(1, Math.round(Number(d.roundPriceTo || 1)));
    d.offerCount.salesTeamExtraOffersFrom = Math.max(0, Math.round(Number(d.offerCount.salesTeamExtraOffersFrom || 0)));
    d.offerCount.salesTeamExtraOffersTo = Math.max(0, Math.round(Number(d.offerCount.salesTeamExtraOffersTo || 0)));
    d.marketing.saturationK = Math.max(1, Number(d.marketing.saturationK || 1));
    d.proximity.genericObjectSaturationK = Math.max(1, Number(d.proximity.genericObjectSaturationK || 1));
    ['regularFrom', 'regularTo', 'premiumFrom', 'premiumTo'].forEach(function (k) {
      d.vendorSuitability[k] = Math.max(1, Math.round(Number(d.vendorSuitability[k] || 1)));
    });
    if (!Array.isArray(d.proximity.penalties)) d.proximity.penalties = [];
    if (!Array.isArray(d.proximity.bonuses)) d.proximity.bonuses = [];
    d.proximity.penalties = d.proximity.penalties.map(function (it) { return { object: String(it.object), value: Math.max(0, Number(it.value) || 0) }; });
    d.proximity.bonuses = d.proximity.bonuses.map(function (it) { return { object: String(it.object), value: Math.max(0, Number(it.value) || 0) }; });
  }

  // ---------- Mount ----------
  function mount(selectorOrElement, initialData, options) {
    var root = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
    if (!root) throw new Error('VendorOffersSettingsComponent: mount element not found.');

    injectStyles();

    var config = Object.assign({
      title: 'Vendor offers settings',
      initiallyExpanded: false,
      objects: {}
    }, options || {});

    var objectsMap = normalizeObjects(config.objects);
    var state = mergeDefaults(DEFAULT_VENDOR_OFFERS_SETTINGS, sanitizeInitialData(initialData));
    var isAdvancedOpen = !!config.initiallyExpanded;
    var inputMap = new Map();
    var openPopover = null;

    function closePopover() {
      if (openPopover && openPopover.parentNode) openPopover.parentNode.removeChild(openPopover);
      openPopover = null;
      document.removeEventListener('mousedown', onDocMouseDown, true);
      document.removeEventListener('keydown', onPopoverKey, true);
      window.removeEventListener('scroll', closePopover, true);
      window.removeEventListener('resize', closePopover);
    }
    function onDocMouseDown(e) { if (openPopover && !openPopover.contains(e.target)) closePopover(); }
    function onPopoverKey(e) { if (e.key === 'Escape') closePopover(); }

    render();

    function render() {
      closePopover();
      inputMap.clear();
      root.innerHTML = '';
      root.classList.add('vo-root');

      var card = el('section', 'vo-card');
      if (isAdvancedOpen) card.classList.add('vo-expanded');
      card.appendChild(renderHeader());
      card.appendChild(renderBody());
      root.appendChild(card);

      syncAllInputsFromState();
      updateComputedHints();
    }

    function renderHeader() {
      var h = el('header', 'vo-card-header');

      var text = el('div', 'vo-header-text');
      var titleRow = el('div', 'vo-title-row');
      titleRow.appendChild(el('h3', 'vo-title', config.title));
      titleRow.appendChild(renderHelp(PLACEHOLDER_DESC, 'lg'));
      text.appendChild(titleRow);
      text.appendChild(el('p', 'vo-subtitle', 'Tune how many vendor offers appear each turn and how their prices are calculated from ticket sales, marketing, and booth location.'));

      var actions = el('div', 'vo-header-actions');
      var toggle = button('', 'vo-btn vo-btn-pill vo-btn-toggle');
      toggle.innerHTML =
        '<span class="vo-toggle-label-open">Advanced settings</span>' +
        '<span class="vo-toggle-label-close">Hide advanced</span>' +
        '<span class="vo-toggle-chevron">' + CHEVRON_SVG + '</span>';
      toggle.setAttribute('aria-expanded', isAdvancedOpen ? 'true' : 'false');
      toggle.addEventListener('click', function () {
        isAdvancedOpen = !isAdvancedOpen;
        var c = root.querySelector('.vo-card');
        if (c) c.classList.toggle('vo-expanded', isAdvancedOpen);
        toggle.setAttribute('aria-expanded', isAdvancedOpen ? 'true' : 'false');
      });
      actions.appendChild(toggle);

      h.appendChild(text);
      h.appendChild(actions);
      return h;
    }

    function renderBody() {
      var body = el('div', 'vo-card-body');
      FIELD_GROUPS.forEach(function (g) {
        var s = renderSection(g);
        if (g.advanced) s.classList.add('vo-advanced-only');
        body.appendChild(s);
      });
      body.appendChild(renderResetFooter());
      return body;
    }

    function renderSection(g) {
      var s = el('div', 'vo-section');
      s.dataset.sectionId = g.id;
      s.appendChild(el('div', 'vo-section-label', g.label));

      var box = el('div', 'vo-section-box');
      if (g.custom === 'proximity') {
        renderProximityInto(box);
      } else if (Array.isArray(g.fields)) {
        var grid = el('div', 'vo-field-grid');
        g.fields.forEach(function (f) { grid.appendChild(renderField(f)); });
        box.appendChild(grid);
        if (g.footer === 'normalize-weights') box.appendChild(renderWeightsFooter());
      }
      s.appendChild(box);
      return s;
    }

    function renderField(field) {
      var w = el('div', 'vo-field');
      var lr = el('div', 'vo-field-label-row');
      lr.appendChild(el('label', 'vo-field-label', field.label));
      lr.appendChild(renderHelp(field.description || PLACEHOLDER_DESC, 'sm'));
      var input = document.createElement('input');
      input.className = 'vo-input';
      input.type = 'number';
      input.step = String(field.step == null ? 1 : field.step);
      if (field.min !== undefined) input.min = String(field.min);
      if (field.max !== undefined) input.max = String(field.max);
      input.dataset.path = field.path;
      input.addEventListener('input', function () {
        var parsed = parseInputValue(input.value, getByPath(DEFAULT_VENDOR_OFFERS_SETTINGS, field.path));
        setByPath(state, field.path, parsed);
        updateComputedHints();
        emitChange();
      });
      inputMap.set(field.path, input);
      w.appendChild(lr);
      w.appendChild(input);
      return w;
    }

    function renderHelp(text, size) {
      var w = el('span', 'vo-help vo-help-' + (size || 'sm'));
      w.tabIndex = 0;
      w.setAttribute('role', 'button');
      w.setAttribute('aria-label', text);
      w.textContent = '?';
      var tip = el('span', 'vo-tooltip');
      tip.textContent = text;
      w.appendChild(tip);
      return w;
    }

    function renderWeightsFooter() {
      var f = el('div', 'vo-weights-footer');
      var total = el('span', 'vo-weights-total');
      total.dataset.weightsTotal = '1';
      total.innerHTML = 'Total weight: <strong>' + getDemandWeightTotal().toFixed(2) + '</strong>';
      var b = button('Normalize to 1.00', 'vo-btn vo-btn-pill vo-btn-quiet');
      b.addEventListener('click', function () {
        normalizeWeights('offerCount.weights');
        syncAllInputsFromState();
        updateComputedHints();
        emitChange();
      });
      f.appendChild(total);
      f.appendChild(b);
      return f;
    }

    // ---------- Proximity custom ----------
    function renderProximityInto(box) {
      var wrap = el('div', 'vo-proximity');

      var top = el('div', 'vo-field-grid');
      top.appendChild(renderField({ path: 'proximity.minMultiplier', label: 'Min location multiplier', min: 0, step: 0.05 }));
      top.appendChild(renderField({ path: 'proximity.maxMultiplier', label: 'Max location multiplier', min: 0, step: 0.05 }));
      wrap.appendChild(top);

      wrap.appendChild(renderObjectList({
        listPath: 'proximity.penalties',
        title: 'Penalties',
        kind: 'penalty',
        description: "Reduce a booth's location value when these objects sit directly next to it. Useful for nearby competing booths.",
        addLabel: 'Add penalty object'
      }));
      wrap.appendChild(renderObjectList({
        listPath: 'proximity.bonuses',
        title: 'Bonuses',
        kind: 'bonus',
        description: "Increase a booth's location value when these objects sit directly next to it. Useful for stages and decorations.",
        addLabel: 'Add bonus object'
      }));

      var bottom = el('div', 'vo-field-grid');
      bottom.appendChild(renderField({ path: 'proximity.genericObjectBonusStrength', label: 'Generic object bonus strength', min: 0, step: 0.01 }));
      bottom.appendChild(renderField({ path: 'proximity.genericObjectSaturationK', label: 'Generic object saturation K', min: 1, step: 1 }));
      wrap.appendChild(bottom);

      box.appendChild(wrap);
    }

    function renderObjectList(opts) {
      var list = getByPath(state, opts.listPath) || [];
      var block = el('div', 'vo-objlist-block');
      block.dataset.listPath = opts.listPath;

      var head = el('div', 'vo-objlist-head');
      var titleRow = el('div', 'vo-objlist-title-row');
      titleRow.appendChild(el('span', 'vo-objlist-title', opts.title));
      titleRow.appendChild(renderHelp(opts.description, 'sm'));
      var count = el('span', 'vo-objlist-count', list.length + (list.length === 1 ? ' object' : ' objects'));
      head.appendChild(titleRow);
      head.appendChild(count);
      block.appendChild(head);

      block.appendChild(el('p', 'vo-objlist-description', opts.description));

      var table = el('div', 'vo-minitable vo-minitable-' + opts.kind);

      var th = el('div', 'vo-minitable-head');
      th.appendChild(el('span', 'vo-mt-col', 'ICON'));
      th.appendChild(el('span', 'vo-mt-col', 'OBJECT'));
      th.appendChild(el('span', 'vo-mt-col vo-mt-col-value', 'VALUE'));
      th.appendChild(el('span', 'vo-mt-col', ''));
      table.appendChild(th);

      if (list.length === 0) {
        table.appendChild(el('div', 'vo-minitable-empty', opts.kind === 'penalty'
          ? 'No penalty objects yet. Add some below to apply a penalty when they sit next to a booth.'
          : 'No bonus objects yet. Add some below to apply a bonus when they sit next to a booth.'));
      } else {
        list.forEach(function (item, idx) { table.appendChild(renderObjectRow(opts.listPath, item, idx, opts.kind)); });
      }

      var footer = el('div', 'vo-minitable-footer');
      var add = button('', 'vo-btn vo-btn-pill vo-btn-add');
      add.innerHTML = PLUS_SVG + '<span>' + opts.addLabel + '</span>';
      var available = getAvailableObjects();
      var totalObjs = Object.keys(objectsMap).length;
      if (totalObjs === 0) {
        add.disabled = true;
        add.innerHTML = PLUS_SVG + '<span>No objects available</span>';
        add.title = 'Pass globalSettings.objects in mount options to enable this.';
      } else if (available.length === 0) {
        add.disabled = true;
        add.innerHTML = PLUS_SVG + '<span>All objects are already used</span>';
      }
      add.addEventListener('click', function (e) {
        e.stopPropagation();
        if (add.disabled) return;
        openAddPopover(add, opts.listPath);
      });
      footer.appendChild(add);
      table.appendChild(footer);

      block.appendChild(table);
      return block;
    }

    function renderObjectRow(listPath, item, idx, kind) {
      var row = el('div', 'vo-mt-row');
      row.appendChild(renderObjectIcon(item.object, kind, 'md'));

      var nameWrap = el('div', 'vo-mt-name-wrap');
      nameWrap.appendChild(el('div', 'vo-mt-name', humanizeId(item.object)));
      nameWrap.appendChild(el('div', 'vo-mt-sub', kind === 'penalty' ? 'Subtracted when adjacent' : 'Added when adjacent'));

      var valueWrap = el('div', 'vo-mt-value vo-mt-value-' + kind);
      valueWrap.appendChild(el('span', 'vo-mt-value-prefix', kind === 'penalty' ? '\u2212' : '+'));
      var input = document.createElement('input');
      input.type = 'number'; input.step = '0.01'; input.min = '0';
      input.value = String(item.value || 0);
      input.className = 'vo-mt-input';
      input.addEventListener('input', function () {
        var live = getByPath(state, listPath) || [];
        if (live[idx]) {
          live[idx].value = Math.max(0, Number(input.value) || 0);
          emitChange();
        }
      });
      valueWrap.appendChild(input);

      var remove = button('', 'vo-mt-remove');
      remove.setAttribute('aria-label', 'Remove');
      remove.innerHTML = X_SVG;
      remove.addEventListener('click', function () {
        var live = getByPath(state, listPath) || [];
        live.splice(idx, 1);
        rerender();
        emitChange();
      });

      row.appendChild(nameWrap);
      row.appendChild(valueWrap);
      row.appendChild(remove);
      return row;
    }

    function renderObjectIcon(objectId, kind, size) {
      var w = el('div', 'vo-obj-icon vo-obj-icon-' + kind + ' vo-obj-icon-' + (size || 'md'));
      var obj = objectsMap[objectId];
      var fallback = getFallbackIconSvg(objectId);
      if (obj && obj.icon) {
        var img = document.createElement('img');
        img.src = obj.icon; img.alt = ''; img.loading = 'lazy';
        img.onerror = function () { w.innerHTML = fallback; };
        w.appendChild(img);
      } else {
        w.innerHTML = fallback;
      }
      return w;
    }

    function getAvailableObjects() {
      var used = new Set();
      (getByPath(state, 'proximity.penalties') || []).forEach(function (i) { used.add(i.object); });
      (getByPath(state, 'proximity.bonuses') || []).forEach(function (i) { used.add(i.object); });
      return Object.keys(objectsMap).filter(function (id) { return !used.has(id); }).sort(function (a, b) { return a.localeCompare(b); });
    }

    function openAddPopover(anchor, listPath) {
      closePopover();
      var available = getAvailableObjects();
      if (available.length === 0) return;

      var pop = el('div', 'vo-popover');
      pop.appendChild(el('div', 'vo-popover-header', 'Choose an object'));
      var list = el('div', 'vo-popover-list');
      available.forEach(function (id) {
        var item = button('', 'vo-popover-item');
        item.appendChild(renderObjectIcon(id, 'neutral', 'sm'));
        item.appendChild(el('span', 'vo-popover-name', humanizeId(id)));
        item.addEventListener('click', function () {
          var cur = getByPath(state, listPath) || [];
          cur.push({ object: id, value: 0.15 });
          closePopover();
          rerender();
          emitChange();
        });
        list.appendChild(item);
      });
      pop.appendChild(list);

      document.body.appendChild(pop);
      var rect = anchor.getBoundingClientRect();
      var popRect = pop.getBoundingClientRect();
      var margin = 8;
      var left = rect.left + window.scrollX;
      var top = rect.bottom + window.scrollY + 6;
      var vr = window.scrollX + document.documentElement.clientWidth;
      if (left + popRect.width > vr - margin) {
        left = Math.max(margin + window.scrollX, vr - popRect.width - margin);
      }
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';

      openPopover = pop;
      setTimeout(function () {
        document.addEventListener('mousedown', onDocMouseDown, true);
        document.addEventListener('keydown', onPopoverKey, true);
        window.addEventListener('scroll', closePopover, true);
        window.addEventListener('resize', closePopover);
      }, 0);
    }

    function rerender() {
      var was = isAdvancedOpen;
      render();
      isAdvancedOpen = was;
      var c = root.querySelector('.vo-card');
      if (c) c.classList.toggle('vo-expanded', isAdvancedOpen);
    }

    function renderResetFooter() {
      var f = el('div', 'vo-reset-footer vo-advanced-only');
      var b = button('Reset all to defaults', 'vo-btn vo-btn-pill vo-btn-quiet vo-btn-reset');
      b.addEventListener('click', function () {
        if (!window.confirm('Reset vendor offer settings to default values?')) return;
        state = clone(DEFAULT_VENDOR_OFFERS_SETTINGS);
        rerender();
        emitChange();
      });
      f.appendChild(b);
      return f;
    }

    function syncAllInputsFromState() {
      inputMap.forEach(function (input, path) {
        var v = getByPath(state, path);
        input.value = v === undefined || v === null ? '' : String(v);
      });
    }

    function updateComputedHints() {
      var t = root.querySelector('[data-weights-total]');
      if (t) t.innerHTML = 'Total weight: <strong>' + getDemandWeightTotal().toFixed(2) + '</strong>';
    }

    function getDemandWeightTotal() {
      var w = getByPath(state, 'offerCount.weights') || {};
      return Number(w.ticketSales || 0) + Number(w.salesEfficiency || 0) + Number(w.marketing || 0) + Number(w.proximity || 0);
    }

    function normalizeWeights(path) {
      var w = getByPath(state, path) || {};
      var keys = Object.keys(w);
      var total = keys.reduce(function (a, k) { return a + Number(w[k] || 0); }, 0);
      if (!Number.isFinite(total) || total <= 0) {
        setByPath(state, path, clone(DEFAULT_VENDOR_OFFERS_SETTINGS.offerCount.weights));
        return;
      }
      var n = {};
      keys.forEach(function (k) { n[k] = roundNumber(Number(w[k] || 0) / total, 4); });
      setByPath(state, path, n);
    }

    function emitChange() {
      root.dispatchEvent(new CustomEvent('vendorOffersSettingsChange', { detail: clone(state), bubbles: true }));
    }

    return {
      getData: function () { var c = clone(state); enforceRanges(c); return c; },
      setData: function (d) { state = mergeDefaults(DEFAULT_VENDOR_OFFERS_SETTINGS, sanitizeInitialData(d)); rerender(); emitChange(); },
      setObjects: function (o) { objectsMap = normalizeObjects(o); rerender(); },
      destroy: function () { closePopover(); root.innerHTML = ''; root.classList.remove('vo-root'); inputMap.clear(); },
      getDefaults: function () { return clone(DEFAULT_VENDOR_OFFERS_SETTINGS); }
    };
  }

  // ---------- Styles ----------
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .vo-root { width: 100%; }
      .vo-root, .vo-root *, .vo-popover, .vo-popover * { box-sizing: border-box; }
      .vo-card {
        --vo-cream:#fbfaf3; --vo-paper:#ffffff; --vo-border:#ece9dd; --vo-border-soft:#f3f1e7;
        --vo-mint:#f1f6e8; --vo-mint-text:#6b8059;
        --vo-text:#1a1a1a; --vo-muted:#6b6b6b; --vo-faint:#a0a09a;
        --vo-input-border:#d8d5cc; --vo-input-border-hover:#c8c5b8;
        --vo-green:#42a55c; --vo-green-soft:#a4d294; --vo-green-bg:#e6f4dc;
        --vo-red:#c83232; --vo-red-bg:#fdecea;
        --vo-tooltip-bg:#2a2a28;
        background: var(--vo-paper); border: 1px solid var(--vo-border); border-radius: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: var(--vo-text); font-size: 13px; line-height: 1.5;
        -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
      }
      .vo-card-header {
        background: var(--vo-mint); padding: 18px 20px;
        border-bottom: 1px solid var(--vo-border);
        border-top-left-radius: 13px; border-top-right-radius: 13px;
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 12px; flex-wrap: wrap;
      }
      .vo-header-text { min-width: 0; flex: 1 1 320px; }
      .vo-title-row { display: flex; align-items: center; gap: 8px; }
      .vo-title { margin: 0; font-size: 16px; font-weight: 500; color: var(--vo-text); letter-spacing: -0.01em; line-height: 1.3; }
      .vo-subtitle { margin: 4px 0 0; font-size: 12px; color: var(--vo-muted); line-height: 1.5; }
      .vo-header-actions { flex: 0 0 auto; }

      .vo-card-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 18px; }

      .vo-section-label { font-size: 10px; letter-spacing: 0.08em; color: var(--vo-faint); font-weight: 500; margin-bottom: 8px; text-transform: uppercase; }
      .vo-section-box { border: 1px solid var(--vo-border); border-radius: 10px; padding: 14px; background: var(--vo-paper); }

      .vo-advanced-only { display: none; }
      .vo-card.vo-expanded .vo-advanced-only { display: block; }
      .vo-card.vo-expanded .vo-reset-footer { display: flex; }

      .vo-field-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .vo-field { min-width: 0; }
      .vo-field-label-row { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }
      .vo-field-label { font-size: 11px; color: var(--vo-muted); line-height: 1.3; }
      .vo-input {
        width: 100%; min-height: 34px; padding: 7px 10px;
        border: 1px solid var(--vo-input-border); border-radius: 7px;
        font-size: 13px; background: var(--vo-paper); color: var(--vo-text);
        font-family: inherit; font-variant-numeric: tabular-nums;
        outline: none; transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .vo-input:hover { border-color: var(--vo-input-border-hover); }
      .vo-input:focus { border-color: var(--vo-green); box-shadow: 0 0 0 3px rgba(66, 165, 92, 0.14); }

      .vo-help {
        position: relative; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 50%; border: 1px solid var(--vo-input-border-hover);
        background: transparent; color: var(--vo-faint);
        font-weight: 500; line-height: 1; cursor: help; user-select: none; outline: none;
        transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
      }
      .vo-help-sm { width: 13px; height: 13px; font-size: 9px; }
      .vo-help-md { width: 14px; height: 14px; font-size: 9px; }
      .vo-help-lg { width: 16px; height: 16px; font-size: 10px; }
      .vo-help:hover, .vo-help:focus { background: var(--vo-green); color: #ffffff; border-color: var(--vo-green); }

      .vo-tooltip {
        position: absolute; left: 50%; bottom: calc(100% + 8px); width: 220px;
        padding: 8px 10px; background: var(--vo-tooltip-bg); color: #fff;
        border-radius: 7px; font-size: 11.5px; font-weight: 400; line-height: 1.45;
        text-align: left; cursor: default;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); z-index: 50;
        opacity: 0; pointer-events: none;
        transform: translateX(-50%) translateY(-4px);
        transition: opacity 140ms ease, transform 140ms ease;
      }
      .vo-tooltip::after {
        content: ''; position: absolute; left: 50%; top: 100%; transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 5px solid transparent; border-right: 5px solid transparent;
        border-top: 5px solid var(--vo-tooltip-bg);
      }
      .vo-help:hover .vo-tooltip, .vo-help:focus .vo-tooltip {
        opacity: 1; transform: translateX(-50%) translateY(0);
      }

      .vo-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        border: none; background: transparent; color: var(--vo-text);
        font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
        padding: 6px 12px; border-radius: 6px;
        transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 80ms ease;
      }
      .vo-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .vo-btn:active:not(:disabled) { transform: translateY(1px); }
      .vo-btn-pill { border-radius: 999px; padding: 6px 14px; border: 1px solid var(--vo-green-soft); color: var(--vo-green); }
      .vo-btn-pill:hover:not(:disabled) { background: var(--vo-green-bg); border-color: var(--vo-green); }
      .vo-btn-quiet { border-color: var(--vo-input-border-hover); color: var(--vo-muted); }
      .vo-btn-quiet:hover:not(:disabled) { background: var(--vo-cream); border-color: var(--vo-muted); color: var(--vo-text); }

      .vo-btn-toggle { white-space: nowrap; }
      .vo-toggle-label-open { display: inline; }
      .vo-toggle-label-close { display: none; }
      .vo-card.vo-expanded .vo-toggle-label-open { display: none; }
      .vo-card.vo-expanded .vo-toggle-label-close { display: inline; }
      .vo-toggle-chevron { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; transition: transform 220ms ease; }
      .vo-toggle-chevron svg { width: 100%; height: 100%; display: block; }
      .vo-card.vo-expanded .vo-toggle-chevron { transform: rotate(180deg); }
      .vo-btn-add svg { width: 12px; height: 12px; display: block; }

      .vo-weights-footer {
        margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--vo-border);
        display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      }
      .vo-weights-total { font-size: 11.5px; color: var(--vo-muted); font-variant-numeric: tabular-nums; }
      .vo-weights-total strong { color: var(--vo-text); font-weight: 500; }

      .vo-proximity { display: flex; flex-direction: column; gap: 16px; }

      .vo-objlist-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
      .vo-objlist-title-row { display: flex; align-items: center; gap: 8px; }
      .vo-objlist-title { font-size: 13px; font-weight: 500; color: var(--vo-text); }
      .vo-objlist-count { font-size: 11px; color: var(--vo-faint); font-variant-numeric: tabular-nums; }
      .vo-objlist-description { margin: 0 0 8px; font-size: 11.5px; color: var(--vo-muted); line-height: 1.45; }

      .vo-minitable { border: 1px solid var(--vo-border); border-radius: 10px; background: var(--vo-paper); }
      .vo-mt-row, .vo-minitable-head {
        display: grid; grid-template-columns: 44px 1fr 110px 32px;
        gap: 10px; align-items: center; padding: 10px 12px;
      }
      .vo-minitable-head {
        background: var(--vo-mint);
        border-top-left-radius: 9px; border-top-right-radius: 9px;
        padding: 8px 12px;
      }
      .vo-mt-col { font-size: 10px; letter-spacing: 0.08em; color: var(--vo-mint-text); font-weight: 500; text-transform: uppercase; }
      .vo-mt-col-value { text-align: right; }
      .vo-mt-row { border-top: 1px solid var(--vo-border-soft); }
      .vo-minitable-empty { padding: 16px 14px; text-align: center; font-size: 12px; color: var(--vo-faint); font-style: italic; border-top: 1px solid var(--vo-border-soft); }
      .vo-minitable-footer {
        padding: 10px 12px; background: var(--vo-cream);
        border-top: 1px solid var(--vo-border-soft);
        border-bottom-left-radius: 9px; border-bottom-right-radius: 9px;
      }

      .vo-obj-icon { display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 9px; flex-shrink: 0; }
      .vo-obj-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
      .vo-obj-icon svg { display: block; }
      .vo-obj-icon-md { width: 36px; height: 36px; }
      .vo-obj-icon-md svg { width: 18px; height: 18px; }
      .vo-obj-icon-sm { width: 28px; height: 28px; border-radius: 7px; }
      .vo-obj-icon-sm svg { width: 15px; height: 15px; }
      .vo-obj-icon-penalty { background: var(--vo-red-bg); color: var(--vo-red); }
      .vo-obj-icon-bonus { background: var(--vo-green-bg); color: var(--vo-green); }
      .vo-obj-icon-neutral { background: var(--vo-mint); color: var(--vo-mint-text); }

      .vo-mt-name-wrap { min-width: 0; }
      .vo-mt-name { font-size: 13px; font-weight: 500; color: var(--vo-text); line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vo-mt-sub { font-size: 11px; color: var(--vo-faint); margin-top: 1px; }

      .vo-mt-value {
        display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px;
        padding: 4px 6px 4px 10px;
        border: 1px solid var(--vo-input-border); border-radius: 7px; background: var(--vo-paper);
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .vo-mt-value:focus-within { border-color: var(--vo-green); box-shadow: 0 0 0 3px rgba(66, 165, 92, 0.14); }
      .vo-mt-value-penalty .vo-mt-value-prefix { color: var(--vo-red); }
      .vo-mt-value-bonus .vo-mt-value-prefix { color: var(--vo-green); }
      .vo-mt-value-prefix { font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; user-select: none; }
      .vo-mt-input {
        width: 56px; border: none; outline: none;
        font-size: 13px; font-weight: 500; text-align: right; background: transparent; padding: 0;
        font-family: inherit; color: var(--vo-text); font-variant-numeric: tabular-nums;
      }
      .vo-mt-input::-webkit-inner-spin-button, .vo-mt-input::-webkit-outer-spin-button { opacity: 0.45; }

      .vo-mt-remove {
        width: 26px; height: 26px; padding: 0; border: none;
        background: var(--vo-red-bg); color: var(--vo-red);
        border-radius: 6px; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        transition: background-color 140ms ease, color 140ms ease;
      }
      .vo-mt-remove:hover { background: var(--vo-red); color: #ffffff; }
      .vo-mt-remove svg { width: 14px; height: 14px; display: block; }

      .vo-reset-footer { display: none; justify-content: flex-end; padding-top: 6px; }
      .vo-btn-reset { font-size: 11.5px; }

      .vo-popover {
        position: absolute; z-index: 1000;
        width: min(280px, calc(100vw - 16px));
        background: #ffffff; border: 1px solid #ece9dd; border-radius: 10px;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.06);
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1a1a1a; overflow: hidden;
      }
      .vo-popover-header {
        padding: 10px 12px; font-size: 10px; letter-spacing: 0.08em;
        text-transform: uppercase; color: #a0a09a; font-weight: 500;
        border-bottom: 1px solid #ece9dd; background: #fbfaf3;
      }
      .vo-popover-list { max-height: 280px; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 2px; }
      .vo-popover-item {
        display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 8px;
        border: none; background: transparent; border-radius: 7px;
        font: inherit; font-size: 13px; font-weight: 400; color: #1a1a1a;
        text-align: left; cursor: pointer; transition: background-color 100ms ease;
      }
      .vo-popover-item:hover { background: #f1f6e8; }
      .vo-popover-item:focus { outline: none; background: #e6f4dc; }
      .vo-popover-name { flex: 1 1 auto; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      @media (max-width: 700px) {
        .vo-card-header { padding: 16px; }
        .vo-card-body { padding: 16px; }
        .vo-mt-row, .vo-minitable-head { grid-template-columns: 40px 1fr 100px 28px; gap: 8px; padding: 8px 10px; }
        .vo-obj-icon-md { width: 32px; height: 32px; }
        .vo-mt-input { width: 48px; }
      }
    `;
    document.head.appendChild(s);
  }

  window.VendorOffersSettingsComponent = {
    mount: mount,
    defaults: clone(DEFAULT_VENDOR_OFFERS_SETTINGS)
  };
})();
