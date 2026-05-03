

const TURN_SUMMARY_STYLES = `
.ts-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--ts-backdrop, rgba(0, 0, 0, 0.45));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--ts-z-index, 9999);
  padding: 16px;
  opacity: 0;
  transition: opacity 150ms ease;
  font-family: var(--ts-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif);
  box-sizing: border-box;
}
.ts-modal-backdrop *,
.ts-modal-backdrop *::before,
.ts-modal-backdrop *::after {
  box-sizing: border-box;
}
.ts-modal-backdrop--visible {
  opacity: 1;
}
.ts-modal {
  background: var(--ts-bg, #ffffff);
  width: 100%;
  max-width: 520px;
  border-radius: var(--ts-radius-lg, 12px);
  border: 0.5px solid var(--ts-border, rgba(0, 0, 0, 0.1));
  overflow: hidden;
  color: var(--ts-text, #1a1a1a);
  transform: scale(0.97);
  transition: transform 150ms ease;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
}
.ts-modal-backdrop--visible .ts-modal {
  transform: scale(1);
}
.ts-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 24px 16px;
  border-bottom: 0.5px solid var(--ts-border, rgba(0, 0, 0, 0.1));
  gap: 12px;
}
.ts-modal__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--ts-text, #1a1a1a);
  line-height: 1.3;
}
.ts-modal__subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ts-text-tertiary, #9a9a9a);
  line-height: 1.4;
}
.ts-modal__close {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0.5px solid var(--ts-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--ts-radius-md, 8px);
  color: var(--ts-text-secondary, #6b6b6b);
  cursor: pointer;
  transition: background 100ms ease, border-color 100ms ease;
  flex-shrink: 0;
}
.ts-modal__close:hover {
  background: var(--ts-surface, #f5f5f5);
  border-color: var(--ts-text-tertiary, #9a9a9a);
}
.ts-modal__hero {
  padding: 22px 24px 20px;
}
.ts-modal__label {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--ts-text-tertiary, #9a9a9a);
  font-weight: 400;
  line-height: 1.4;
}
.ts-modal__hero-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.ts-modal__hero-num {
  font-size: 30px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.ts-modal__delta {
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.ts-modal__delta--up {
  color: var(--ts-success, #0f6e56);
}
.ts-modal__delta--down {
  color: var(--ts-danger, #a32d2d);
}
.ts-modal__hint {
  font-size: 13px;
  color: var(--ts-text-tertiary, #9a9a9a);
}
.ts-modal__section {
  padding: 0 24px 20px;
}
.ts-modal__lines {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 14px;
}
.ts-modal__line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.ts-modal__line-name {
  color: var(--ts-text-secondary, #6b6b6b);
}
.ts-modal__line-val {
  font-variant-numeric: tabular-nums;
}
.ts-modal__line--total {
  padding-top: 9px;
  margin-top: 3px;
  border-top: 0.5px solid var(--ts-border, rgba(0, 0, 0, 0.1));
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.ts-modal__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  table-layout: fixed;
}
.ts-modal__th {
  color: var(--ts-text-tertiary, #9a9a9a);
  font-size: 11px;
  font-weight: 400;
  text-align: left;
  padding: 6px 4px;
}
.ts-modal__th:first-child {
  width: 22%;
  padding-left: 0;
}
.ts-modal__th:last-child {
  padding-right: 0;
}
.ts-modal__th--num {
  text-align: right;
}
.ts-modal__row {
  border-top: 0.5px solid var(--ts-border, rgba(0, 0, 0, 0.1));
}
.ts-modal__cell {
  padding: 9px 4px;
}
.ts-modal__cell--name {
  color: var(--ts-text-secondary, #6b6b6b);
  padding-left: 0;
}
.ts-modal__cell--num {
  text-align: right;
}
.ts-modal__cell--num:last-child {
  padding-right: 0;
}
.ts-modal__cell--muted {
  color: var(--ts-text-tertiary, #9a9a9a);
}
.ts-modal__footer {
  padding: 14px 24px;
  background: var(--ts-surface, #f5f5f5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.ts-modal__footer-info {
  font-size: 12px;
  color: var(--ts-text-secondary, #6b6b6b);
  line-height: 1.5;
}
.ts-modal__strong {
  color: var(--ts-text, #1a1a1a);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.ts-modal__sep {
  color: var(--ts-text-tertiary, #9a9a9a);
  margin: 0 6px;
}
.ts-modal__cta {
  background: var(--ts-cta-bg, #1a1a1a);
  color: var(--ts-cta-text, #ffffff);
  border: none;
  padding: 7px 14px;
  border-radius: var(--ts-radius-md, 8px);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 100ms ease, transform 80ms ease;
  white-space: nowrap;
}
.ts-modal__cta:hover {
  opacity: 0.85;
}
.ts-modal__cta:active {
  transform: scale(0.98);
}
.ts-modal__close:focus-visible,
.ts-modal__cta:focus-visible {
  outline: 2px solid var(--ts-cta-bg, #1a1a1a);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .ts-modal-backdrop,
  .ts-modal,
  .ts-modal__cta {
    transition: none;
  }
}
`;

class TurnSummaryModal {
  constructor(options = {}) {
    this.options = Object.assign({
      turnNumber: 1,
      title: null,             // overrides "Turn N summary"
      subtitle: null,          // overrides default subtitle, or set '' to hide
      openingBalance: 0,
      closingBalance: 0,
      objectIncome: 0,
      ticketIncome: 0,
      totalIncome: null,       // auto = objectIncome + ticketIncome
      groups: [],              // [{ name, thisTurn, total, pace, suitability, interest }]
      ticketPrice: 0,
      reasonableness: null,    // { current, target } or null to hide
      currency: '€',
      continueLabel: null,     // overrides "Plan turn N+1 →"
      showContinueButton: true,
      dismissible: true,       // ESC key + backdrop click
      onClose: null,
      onContinue: null,
    }, options);

    this.backdropEl = null;
    this._previouslyFocused = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  static ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ts-modal-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'ts-modal-styles';
    styleEl.textContent = TURN_SUMMARY_STYLES;
    document.head.appendChild(styleEl);
  }

  show() {
    if (this.backdropEl) return this;
    TurnSummaryModal.ensureStyles();
    this._previouslyFocused = document.activeElement;
    this.backdropEl = this._buildBackdrop();
    document.body.appendChild(this.backdropEl);
    document.addEventListener('keydown', this._handleKeyDown);
    requestAnimationFrame(() => {
      this.backdropEl.classList.add('ts-modal-backdrop--visible');
      const cta = this.backdropEl.querySelector('[data-ts-action="continue"]')
                || this.backdropEl.querySelector('[data-ts-action="close"]');
      if (cta) cta.focus();
    });
    return this;
  }

  close() {
    if (!this.backdropEl) return;
    document.removeEventListener('keydown', this._handleKeyDown);
    const el = this.backdropEl;
    el.classList.remove('ts-modal-backdrop--visible');
    this.backdropEl = null;
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 150);
    if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
      this._previouslyFocused.focus();
    }
    if (typeof this.options.onClose === 'function') {
      this.options.onClose();
    }
  }

  /** Re-render in place with new values. */
  update(newOptions) {
    Object.assign(this.options, newOptions);
    if (!this.backdropEl) return;
    this.backdropEl.innerHTML = this._buildModalHtml();
    this._attachHandlers();
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.options.dismissible) {
      e.stopPropagation();
      this.close();
    }
  }

  _formatMoney(amount) {
    const n = Math.round(Number(amount) || 0);
    const sign = n < 0 ? '-' : '';
    return `${sign}${this.options.currency}${Math.abs(n)}`;
  }

  _formatDelta(amount) {
    const n = Math.round(Number(amount) || 0);
    if (n === 0) return `${this.options.currency}0`;
    const sign = n > 0 ? '+' : '-';
    return `${sign}${this.options.currency}${Math.abs(n)}`;
  }

  _escape(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  _buildBackdrop() {
    const backdrop = document.createElement('div');
    backdrop.className = 'ts-modal-backdrop';
    backdrop.innerHTML = this._buildModalHtml();
    this.backdropEl = backdrop;
    this._attachHandlers();
    return backdrop;
  }

  _buildModalHtml() {
    const o = this.options;
    const totalIncome = o.totalIncome != null
      ? o.totalIncome
      : (Number(o.objectIncome) || 0) + (Number(o.ticketIncome) || 0);
    const delta = (Number(o.closingBalance) || 0) - (Number(o.openingBalance) || 0);

    const title = o.title || `Turn ${o.turnNumber} summary`;
    const subtitle = o.subtitle != null
      ? o.subtitle
      : `Objective report — close to plan turn ${o.turnNumber + 1}`;
    const continueLabel = o.continueLabel || `Plan turn ${o.turnNumber + 1} →`;

    const groupRowsHtml = (o.groups || []).map(g => `
      <tr class="ts-modal__row">
        <td class="ts-modal__cell ts-modal__cell--name">${this._escape(g.name)}</td>
        <td class="ts-modal__cell ts-modal__cell--num">+${Math.round(Number(g.thisTurn) || 0)}</td>
        <td class="ts-modal__cell ts-modal__cell--num">${Math.round(Number(g.total) || 0)}</td>
        <td class="ts-modal__cell ts-modal__cell--num ts-modal__cell--muted">${Math.round(Number(g.pace) || 0)}%</td>
        <td class="ts-modal__cell ts-modal__cell--num">${Math.round(Number(g.suitability) || 0)}</td>
        <td class="ts-modal__cell ts-modal__cell--num">${Math.round(Number(g.interest) || 0)}</td>
      </tr>
    `).join('');

    const reasonablenessHtml = o.reasonableness
      ? `<span class="ts-modal__sep">·</span>Reasonableness <span class="ts-modal__strong">${Number(o.reasonableness.current).toFixed(2)} / ${Number(o.reasonableness.target).toFixed(2)}</span>`
      : '';

    const continueBtnHtml = o.showContinueButton
      ? `<button class="ts-modal__cta" type="button" data-ts-action="continue">${this._escape(continueLabel)}</button>`
      : '';

    const subtitleHtml = subtitle
      ? `<p class="ts-modal__subtitle">${this._escape(subtitle)}</p>`
      : '';

    const deltaClass = delta > 0 ? 'ts-modal__delta--up' : (delta < 0 ? 'ts-modal__delta--down' : '');
    const deltaHtml = delta !== 0
      ? `<span class="ts-modal__delta ${deltaClass}">${this._formatDelta(delta)}</span>`
      : '';

    const groupsSectionHtml = (o.groups && o.groups.length) ? `
      <section class="ts-modal__section">
        <p class="ts-modal__label">By group</p>
        <table class="ts-modal__table">
          <thead>
            <tr>
              <th class="ts-modal__th">Group</th>
              <th class="ts-modal__th ts-modal__th--num">This turn</th>
              <th class="ts-modal__th ts-modal__th--num">Total</th>
              <th class="ts-modal__th ts-modal__th--num">Pace</th>
              <th class="ts-modal__th ts-modal__th--num">Suit.</th>
              <th class="ts-modal__th ts-modal__th--num">Int.</th>
            </tr>
          </thead>
          <tbody>${groupRowsHtml}</tbody>
        </table>
      </section>
    ` : '';

    return `
      <div class="ts-modal" role="dialog" aria-modal="true" aria-labelledby="ts-modal-title">
        <header class="ts-modal__header">
          <div>
            <h3 class="ts-modal__title" id="ts-modal-title">${this._escape(title)}</h3>
            ${subtitleHtml}
          </div>
          <button class="ts-modal__close" type="button" aria-label="Close" data-ts-action="close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </header>

        <section class="ts-modal__hero">
          <p class="ts-modal__label">Closing balance</p>
          <div class="ts-modal__hero-row">
            <span class="ts-modal__hero-num">${this._formatMoney(o.closingBalance)}</span>
            ${deltaHtml}
            <span class="ts-modal__hint">from ${this._formatMoney(o.openingBalance)} opening</span>
          </div>
        </section>

        <section class="ts-modal__section">
          <p class="ts-modal__label">Income</p>
          <div class="ts-modal__lines">
            <div class="ts-modal__line">
              <span class="ts-modal__line-name">Object income</span>
              <span class="ts-modal__line-val">${this._formatMoney(o.objectIncome)}</span>
            </div>
            <div class="ts-modal__line">
              <span class="ts-modal__line-name">Ticket income</span>
              <span class="ts-modal__line-val">${this._formatMoney(o.ticketIncome)}</span>
            </div>
            <div class="ts-modal__line ts-modal__line--total">
              <span>Total</span>
              <span>${this._formatMoney(totalIncome)}</span>
            </div>
          </div>
        </section>

        ${groupsSectionHtml}

        <footer class="ts-modal__footer">
          <div class="ts-modal__footer-info">
            Ticket price <span class="ts-modal__strong">${this._formatMoney(o.ticketPrice)}</span>${reasonablenessHtml}
          </div>
          ${continueBtnHtml}
        </footer>
      </div>
    `;
  }

  _attachHandlers() {
    if (!this.backdropEl) return;

    this.backdropEl.addEventListener('click', (e) => {
      if (e.target === this.backdropEl && this.options.dismissible) {
        this.close();
      }
    });

    const closeBtn = this.backdropEl.querySelector('[data-ts-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    const continueBtn = this.backdropEl.querySelector('[data-ts-action="continue"]');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        if (typeof this.options.onContinue === 'function') {
          this.options.onContinue();
        } else {
          this.close();
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.TurnSummaryModal = TurnSummaryModal;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TurnSummaryModal;
}
