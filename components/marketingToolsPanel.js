

const MARKETING_TOOLS_STYLES = `
.mt-panel {
  background: var(--mt-bg, #ffffff);
  width: min(360px, calc(100vw - 32px));
  max-width:100%;
  border-radius: var(--mt-radius-lg, 12px);
  border: 0.5px solid var(--mt-border, rgba(0, 0, 0, 0.1));
  padding: 20px;
  color: var(--mt-text, #1a1a1a);
  font-family: var(--mt-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif);
  box-sizing: border-box;
}
.mt-panel *,
.mt-panel *::before,
.mt-panel *::after {
  box-sizing: border-box;
}
.mt-panel__header {
  margin-bottom: 18px;
}
.mt-panel__title {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--mt-text, #1a1a1a);
}
.mt-panel__subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--mt-text-secondary, #6b6b6b);
  line-height: 1.4;
}
.mt-panel__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.mt-panel__section-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--mt-text-tertiary, #9a9a9a);
}
.mt-panel__section-hint {
  font-size: 10px;
  color: var(--mt-text-tertiary, #9a9a9a);
}
.mt-panel__channels {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}
.mt-panel__channel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.mt-panel__channel-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--mt-text, #1a1a1a);
}
.mt-panel__channel-name svg {
  width: 14px;
  height: 14px;
  color: var(--mt-text-secondary, #6b6b6b);
  flex-shrink: 0;
}
.mt-panel__channel-cost {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  background: var(--mt-accent-bg, #EAF3DE);
  color: var(--mt-accent-text, #27500A);
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.mt-panel__slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  height: 18px;
  margin: 0;
  padding: 0;
}
.mt-panel__slider:focus {
  outline: none;
}
.mt-panel__slider::-webkit-slider-runnable-track {
  height: 4px;
  background: var(--mt-surface, #ececec);
  border-radius: 999px;
}
.mt-panel__slider::-moz-range-track {
  height: 4px;
  background: var(--mt-surface, #ececec);
  border-radius: 999px;
  border: none;
}
.mt-panel__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--mt-accent-strong, #3B6D11);
  border: none;
  margin-top: -5px;
  transition: transform 80ms ease;
}
.mt-panel__slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--mt-accent-strong, #3B6D11);
  border: none;
  transition: transform 80ms ease;
}
.mt-panel__slider:active::-webkit-slider-thumb {
  transform: scale(1.15);
}
.mt-panel__slider:active::-moz-range-thumb {
  transform: scale(1.15);
}
.mt-panel__slider:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px var(--mt-accent-bg, #EAF3DE);
}
.mt-panel__slider:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 3px var(--mt-accent-bg, #EAF3DE);
}
.mt-panel__divider {
  border-top: 0.5px solid var(--mt-border, rgba(0, 0, 0, 0.1));
  padding-top: 14px;
}
.mt-panel__assets {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mt-panel__asset {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 0.5px solid var(--mt-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--mt-radius-md, 8px);
  transition: border-color 100ms ease;
}
.mt-panel__asset--owned {
  background: var(--mt-accent-bg, #EAF3DE);
  border-color: transparent;
}
.mt-panel__asset-icon {
  width: 32px;
  height: 32px;
  background: var(--mt-accent-bg, #EAF3DE);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mt-panel__asset-icon svg {
  width: 16px;
  height: 16px;
  color: var(--mt-accent-strong, #3B6D11);
}
.mt-panel__asset--owned .mt-panel__asset-icon {
  background: var(--mt-bg, #ffffff);
}
.mt-panel__asset-body {
  flex: 1;
  min-width: 0;
}
.mt-panel__asset-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--mt-text, #1a1a1a);
}
.mt-panel__asset-blurb {
  font-size: 11px;
  color: var(--mt-text-secondary, #6b6b6b);
  margin-top: 1px;
}
.mt-panel__asset-action {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.mt-panel__asset-price {
  font-size: 12px;
  font-weight: 500;
  color: var(--mt-text, #1a1a1a);
  font-variant-numeric: tabular-nums;
}
.mt-panel__asset-price--unaffordable {
  color: var(--mt-text-tertiary, #9a9a9a);
}
.mt-panel__buy {
  font-size: 11px;
  font-weight: 500;
  padding: 5px 12px;
  background: var(--mt-accent-strong, #3B6D11);
  color: var(--mt-accent-strong-text, #ffffff);
  border: none;
  border-radius: var(--mt-radius-sm, 6px);
  cursor: pointer;
  font-family: inherit;
  transition: background 100ms ease, transform 80ms ease;
}
.mt-panel__buy:hover {
  background: var(--mt-accent-strong-hover, #27500A);
}
.mt-panel__buy:active {
  transform: scale(0.97);
}
.mt-panel__buy:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--mt-accent-strong, #3B6D11);
  transform: none;
}
.mt-panel__owned-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  background: var(--mt-bg, #ffffff);
  color: var(--mt-accent-text, #27500A);
  border-radius: 999px;
}
.mt-panel__owned-badge svg {
  width: 10px;
  height: 10px;
}
.mt-panel__footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 0.5px solid var(--mt-border, rgba(0, 0, 0, 0.1));
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mt-panel__footer-label {
  font-size: 12px;
  color: var(--mt-text-secondary, #6b6b6b);
}
.mt-panel__footer-value {
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--mt-text, #1a1a1a);
}
.mt-panel__buy:focus-visible {
  outline: 2px solid var(--mt-accent-strong, #3B6D11);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .mt-panel__slider::-webkit-slider-thumb,
  .mt-panel__slider::-moz-range-thumb,
  .mt-panel__buy,
  .mt-panel__asset {
    transition: none;
  }
}
`;

const MT_DEFAULT_ICONS = {
  "Billboards": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="11" rx="1"/><line x1="8" y1="20" x2="8" y2="15"/><line x1="16" y1="20" x2="16" y2="15"/></svg>',
  "Bus and Train":   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="12" rx="2"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/><line x1="4" y1="11" x2="20" y2="11"/></svg>',
  "Social Media":     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>',
  "TV":         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  website:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  check:      '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 6.5 5 9 9.5 3.5"/></svg>',
};

class MarketingToolsPanel {
  constructor(options = {}) {
    this.options = Object.assign({
      mountTo: null,           // DOM element or selector — where to render
      title: 'Marketing tools',
      subtitle: 'Adjust spend per channel or buy assets',

      channels: [],            // [{ id, label, value, min, max, step?, icon? }]
      assets: [],              // [{ id, label, blurb?, price, owned?, icon? }]

      budget: Infinity,        // current player budget — controls afford state
      currency: '€',

      channelsLabel: 'Channels',
      channelsHint: 'per turn',
      assetsLabel: 'Assets',
      assetsHint: 'one-time',
      totalLabel: 'This turn',
      ownedLabel: 'Owned',
      showTotal: true,

      onChannelChange: null,   // (id, value) => void
      onAssetBuy: null,        // (id) => void  — fired on click; you decide whether to set owned
    }, options);

    this.rootEl = null;
    this.containerEl = null;
  }

  static ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('mt-panel-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'mt-panel-styles';
    styleEl.textContent = MARKETING_TOOLS_STYLES;
    document.head.appendChild(styleEl);
  }

  show() {
    if (this.rootEl) return this;
    MarketingToolsPanel.ensureStyles();

    const container = this._resolveContainer();
    if (!container) {
      console.warn('MarketingToolsPanel: no mountTo container provided.');
      return this;
    }
    this.containerEl = container;

    this.rootEl = document.createElement('div');
    this.rootEl.className = 'mt-panel';
    this.rootEl.setAttribute('role', 'group');
    this.rootEl.setAttribute('aria-label', this.options.title);
    this.rootEl.innerHTML = this._buildHtml();
    container.appendChild(this.rootEl);

    this._attachHandlers();
    return this;
  }

  close() {
    if (!this.rootEl) return;
    if (this.rootEl.parentNode) this.rootEl.parentNode.removeChild(this.rootEl);
    this.rootEl = null;
    this.containerEl = null;
  }

  /** Full re-render with new options merged in. */
  update(newOptions) {
    Object.assign(this.options, newOptions);
    if (!this.rootEl) return;
    this.rootEl.innerHTML = this._buildHtml();
    this._attachHandlers();
  }

  /** Granular update: change a single channel's value without losing focus. */
  setChannelValue(id, value) {
    const ch = this.options.channels.find(c => c.id === id);
    if (!ch) return;
    ch.value = value;
    if (!this.rootEl) return;
    const slider = this.rootEl.querySelector(`[data-mt-channel="${id}"] input`);
    const cost   = this.rootEl.querySelector(`[data-mt-channel="${id}"] .mt-panel__channel-cost`);
    if (slider) slider.value = String(value);
    if (cost)   cost.textContent = this._formatMoney(value);
    this._refreshTotal();
  }

  /** Granular update: flip an asset between buyable and owned. */
  setAssetOwned(id, owned) {
    const asset = this.options.assets.find(a => a.id === id);
    if (!asset) return;
    asset.owned = !!owned;
    if (this.rootEl) {
      this.rootEl.innerHTML = this._buildHtml();
      this._attachHandlers();
    }
  }

  /** Granular update: change the budget (re-evaluates afford state). */
  setBudget(budget) {
    this.options.budget = budget;
    if (this.rootEl) {
      this.rootEl.innerHTML = this._buildHtml();
      this._attachHandlers();
    }
  }

  /** Read current state — useful for snapshotting before saving a turn. */
  getValues() {
    const channels = {};
    let totalRecurring = 0;
    for (const c of this.options.channels) {
      const v = Math.round(Number(c.value) || 0);
      channels[c.id] = v;
      totalRecurring += v;
    }
    const assets = {};
    for (const a of this.options.assets) {
      assets[a.id] = !!a.owned;
    }
    return { channels, assets, totalRecurring };
  }

  // ───────────────── internals ─────────────────

  _resolveContainer() {
    const m = this.options.mountTo;
    if (!m) return null;
    if (typeof m === 'string') return document.querySelector(m);
    return m;
  }

  _formatMoney(amount) {
    const n = Math.round(Number(amount) || 0);
    return `${this.options.currency}${n.toLocaleString()}`;
  }

  _escape(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  _iconHtml(channelOrAsset) {
    if (channelOrAsset.icon) return channelOrAsset.icon;
    return MT_DEFAULT_ICONS[channelOrAsset.id] || '';
  }

  _totalRecurring() {
    return (this.options.channels || []).reduce(
      (sum, c) => sum + (Math.round(Number(c.value) || 0)), 0
    );
  }

  _refreshTotal() {
    if (!this.rootEl || !this.options.showTotal) return;
    const el = this.rootEl.querySelector('.mt-panel__footer-value');
    if (el) el.textContent = this._formatMoney(this._totalRecurring());
  }

  _buildHtml() {
    const o = this.options;

    const channelsHtml = (o.channels || []).map(c => {
      const min  = c.min  != null ? c.min  : 0;
      const max  = c.max  != null ? c.max  : 200;
      const step = c.step != null ? c.step : 1;
      return `
        <div class="mt-panel__channel" data-mt-channel="${this._escape(c.id)}">
          <div class="mt-panel__channel-head">
            <div class="mt-panel__channel-name">
              ${this._iconHtml(c)}
              <span>${this._escape(c.label)}</span>
            </div>
            <span class="mt-panel__channel-cost">${this._formatMoney(c.value)}</span>
          </div>
          <input
            type="range"
            class="mt-panel__slider"
            min="${min}" max="${max}" step="${step}"
            value="${Math.round(Number(c.value) || 0)}"
            aria-label="${this._escape(c.label)} spend"
          >
        </div>
      `;
    }).join('');

    const assetsHtml = (o.assets || []).map(a => {
      const owned        = !!a.owned;
      const price        = Math.round(Number(a.price) || 0);
      const canAfford    = (Number(o.budget) || 0) >= price;
      const ownedClass   = owned ? ' mt-panel__asset--owned' : '';
      const blurbHtml    = a.blurb ? `<div class="mt-panel__asset-blurb">${this._escape(a.blurb)}</div>` : '';

      let actionHtml;
      if (owned) {
        actionHtml = `
          <span class="mt-panel__owned-badge">
            ${MT_DEFAULT_ICONS.check}
            ${this._escape(o.ownedLabel)}
          </span>
        `;
      } else {
        const priceClass = canAfford ? '' : ' mt-panel__asset-price--unaffordable';
        const disabled   = canAfford ? '' : 'disabled';
        const titleAttr  = canAfford ? '' : `title="Need ${this._formatMoney(price)}"`;
        actionHtml = `
          <span class="mt-panel__asset-price${priceClass}">${this._formatMoney(price)}</span>
          <button
            type="button"
            class="mt-panel__buy"
            data-mt-asset="${this._escape(a.id)}"
            ${disabled}
            ${titleAttr}
          >Buy</button>
        `;
      }

      return `
        <div class="mt-panel__asset${ownedClass}" data-mt-asset-row="${this._escape(a.id)}">
          <div class="mt-panel__asset-icon">${this._iconHtml(a)}</div>
          <div class="mt-panel__asset-body">
            <div class="mt-panel__asset-name">${this._escape(a.label)}</div>
            ${blurbHtml}
          </div>
          <div class="mt-panel__asset-action">${actionHtml}</div>
        </div>
      `;
    }).join('');

    const subtitleHtml = o.subtitle
      ? `<p class="mt-panel__subtitle">${this._escape(o.subtitle)}</p>`
      : '';

    const channelsSectionHtml = (o.channels && o.channels.length) ? `
      <div class="mt-panel__section-head">
        <span class="mt-panel__section-label">${this._escape(o.channelsLabel)}</span>
        <span class="mt-panel__section-hint">${this._escape(o.channelsHint)}</span>
      </div>
      <div class="mt-panel__channels">${channelsHtml}</div>
    ` : '';

    const assetsSectionHtml = (o.assets && o.assets.length) ? `
      <div class="mt-panel__divider">
        <div class="mt-panel__section-head">
          <span class="mt-panel__section-label">${this._escape(o.assetsLabel)}</span>
          <span class="mt-panel__section-hint">${this._escape(o.assetsHint)}</span>
        </div>
        <div class="mt-panel__assets">${assetsHtml}</div>
      </div>
    ` : '';

    const footerHtml = o.showTotal ? `
      <div class="mt-panel__footer">
        <span class="mt-panel__footer-label">${this._escape(o.totalLabel)}</span>
        <span class="mt-panel__footer-value">${this._formatMoney(this._totalRecurring())}</span>
      </div>
    ` : '';

    return `
      <div class="mt-panel__header">
        <h3 class="mt-panel__title">${this._escape(o.title)}</h3>
        ${subtitleHtml}
      </div>
      ${channelsSectionHtml}
      ${assetsSectionHtml}
      ${footerHtml}
    `;
  }

  _attachHandlers() {
    if (!this.rootEl) return;

    // Sliders — update model + cost pill on input, fire callback.
    const sliders = this.rootEl.querySelectorAll('[data-mt-channel] input');
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const wrap = e.target.closest('[data-mt-channel]');
        const id   = wrap && wrap.getAttribute('data-mt-channel');
        const val  = Math.round(Number(e.target.value) || 0);
        const ch   = this.options.channels.find(c => c.id === id);
        if (ch) ch.value = val;
        const cost = wrap && wrap.querySelector('.mt-panel__channel-cost');
        if (cost) cost.textContent = this._formatMoney(val);
        this._refreshTotal();
        if (typeof this.options.onChannelChange === 'function') {
          this.options.onChannelChange(id, val);
        }
      });
    });

    // Buy buttons — fire callback. The host decides whether to flip `owned`.
    const buyButtons = this.rootEl.querySelectorAll('[data-mt-asset]');
    buyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-mt-asset');
        if (typeof this.options.onAssetBuy === 'function') {
          this.options.onAssetBuy(id);
        }
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.MarketingToolsPanel = MarketingToolsPanel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarketingToolsPanel;
}
