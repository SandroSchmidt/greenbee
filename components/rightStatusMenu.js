/**
 * StatusMenu — a state-driven right panel for GreenBee.
 *
 * No dependencies. Vanilla JS + injected stylesheet. Themeable via CSS variables.
 *
 * STRUCTURE
 * ---------
 *   ┌─────────────────────────┐
 *   │ TURN N        N of TOTAL│  ← header (always on)
 *   │ ━━━━━━━━━░░░░░░         │
 *   │ Budget         €X,XXX   │
 *   │              +€XXX delta│
 *   ├─────────────────────────┤
 *   │ [optional warning bar]  │  ← warning slot (optional)
 *   │ [body content variant]  │  ← body slot (variant-driven)
 *   ├─────────────────────────┤
 *   │ Restart       Next turn │  ← footer (always on)
 *   └─────────────────────────┘
 *
 * USAGE
 * -----
 *   const panel = new StatusMenu({
 *     turnNumber: 9,
 *     totalTurns: 12,
 *     budget: 2105,
 *     budgetDelta: 340,
 *     body: { type: 'projection-card' },
 *     onNextTurn: () => advanceTurn(),
 *     onProjection: () => fetchProjection(),
 *     onRestart: () => confirmRestart(),
 *   });
 *   panel.mount('#right-panel');
 *
 *   // later — update piece-by-piece
 *   panel.update({ budget: 2445, budgetDelta: 340 });
 *   panel.setBody({ type: 'tile-details', sections: [...] });
 *   panel.setWarning('Budget below €100');
 *   panel.clearWarning();
 *
 *   // on game end
 *   panel.destroy();
 *
 * BODY VARIANTS
 * -------------
 *   { type: 'idle' }
 *     → "Click a tile to build · hover for details"
 *
 *   { type: 'hint', text: '...' }
 *     → custom muted hint text
 *
 *   { type: 'projection-card', byline?, description?, ctaLabel? }
 *     → assistant CTA card. Click fires onProjection.
 *
 *   { type: 'projection-result', amount?, byline?, description?, hint? }
 *     → result of an assistant projection (hides CTA until next turn)
 *
 *   { type: 'tile-details', sections: [{ label, lines: [{name, value}] }] }
 *     → key-value readout. Use for hover or click context.
 *
 *   { type: 'custom', html: '...' }
 *     → escape hatch. Insert any HTML you want.
 *
 * WARNING SEVERITIES
 * ------------------
 *   panel.setWarning('msg')                    → amber (warning)
 *   panel.setWarning('msg', 'danger')          → red
 *   panel.update({ warning: { message, severity } })
 *   panel.setNotification('msg')               → blue/info notice
 *   panel.setNotification('msg', 'success')    → green notice
 *
 * THEMING
 * -------
 *   Override on :root or .gp-panel:
 *     --gp-bg, --gp-surface, --gp-border,
 *     --gp-text, --gp-text-secondary, --gp-text-tertiary,
 *     --gp-success, --gp-danger,
 *     --gp-action-primary, --gp-action-text,
 *     --gp-warning-bg, --gp-warning-border, --gp-warning-text,
 *     --gp-notification-bg, --gp-notification-border, --gp-notification-text,
 *     --gp-radius-md, --gp-radius-lg, --gp-font-family
 */

const GAME_PANEL_STYLES = `
.gp-panel {
  --gp-bg: #ffffff;
  --gp-surface: #fafaf9;
  --gp-border: rgba(0, 0, 0, 0.1);
  --gp-text: #2a2a2a;
  --gp-text-secondary: #525252;
  --gp-text-tertiary: #9a9a9a;
  --gp-success: #16a34a;
  --gp-danger: #dc2626;
  --gp-action-primary: #16a34a;
  --gp-action-text: #ffffff;
  --gp-warning-bg: #fef3c7;
  --gp-warning-border: #f59e0b;
  --gp-warning-text: #78350f;
  --gp-warning-icon: #b45309;
  --gp-danger-bg: #fee2e2;
  --gp-danger-border: #dc2626;
  --gp-danger-text: #7f1d1d;
  --gp-notification-bg: #eff6ff;
  --gp-notification-border: #3b82f6;
  --gp-notification-text: #1e3a8a;
  --gp-notification-icon: #2563eb;
  --gp-notification-success-bg: #ecfdf5;
  --gp-notification-success-border: #10b981;
  --gp-notification-success-text: #065f46;
  --gp-radius-md: 8px;
  --gp-radius-lg: 12px;
  --gp-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                    "Helvetica Neue", sans-serif;

  background: var(--gp-bg);
  
  font-family: var(--gp-font-family);
  color: var(--gp-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}
.gp-panel *, .gp-panel *::before, .gp-panel *::after {
  box-sizing: border-box;
}
body.theme-dark .gp-panel,
[data-theme="dark"] .gp-panel {
  --gp-bg: #1e293b;
  --gp-surface: #182236;
  --gp-border: rgba(255, 255, 255, 0.1);
  --gp-text: #e5e7eb;
  --gp-text-secondary: #94a3b8;
  --gp-text-tertiary: #64748b;
  --gp-action-primary: #10b981;
  --gp-warning-bg: rgba(245, 158, 11, 0.14);
  --gp-warning-border: rgba(245, 158, 11, 0.4);
  --gp-warning-text: #fcd34d;
  --gp-danger-bg: rgba(220, 38, 38, 0.14);
  --gp-danger-border: rgba(248, 113, 113, 0.4);
  --gp-danger-text: #fca5a5;
  --gp-notification-bg: rgba(59, 130, 246, 0.14);
  --gp-notification-border: rgba(96, 165, 250, 0.4);
  --gp-notification-text: #bfdbfe;
  --gp-notification-success-bg: rgba(16, 185, 129, 0.14);
  --gp-notification-success-border: rgba(52, 211, 153, 0.4);
  --gp-notification-success-text: #a7f3d0;
}

/* ---------- Header ---------- */
.gp-panel__head {
  padding: 16px 20px 14px;
  flex: 0 0 auto;
}
.gp-panel__turn-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.gp-panel__turn {
  font-size: 11px;
  color: var(--gp-text-tertiary);
  letter-spacing: 0.04em;
  font-weight: 500;
  text-transform: uppercase;
}
.gp-panel__progress-text {
  font-size: 11px;
  color: var(--gp-text-tertiary);
  font-variant-numeric: tabular-nums;
}
.gp-panel__progress-bar {
  height: 2px;
  background: var(--gp-surface);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}
.gp-panel__progress-fill {
  height: 100%;
  background: var(--gp-text-secondary);
  border-radius: 2px;
  transition: width 200ms ease;
}
.gp-panel__budget-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
}
.gp-panel__budget-label {
  font-size: 12px;
  color: var(--gp-text-tertiary);
}
.gp-panel__budget-num {
  font-size: 22px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.gp-panel__budget-delta-row {
  text-align: right;
  margin-top: 2px;
  min-height: 16px;
}
.gp-panel__budget-delta {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.gp-panel__budget-delta--up { color: var(--gp-success); }
.gp-panel__budget-delta--down { color: var(--gp-danger); }
.gp-panel__budget-delta--zero { color: var(--gp-text-tertiary); }

/* ---------- Divider ---------- */
.gp-panel__divider {
  height: 0.5px;
  background: var(--gp-border);
  flex: 0 0 auto;
}

/* ---------- Body ---------- */
.gp-panel__body {
  padding: 12px 14px;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.gp-panel__hint {
  font-size: 12px;
  color: var(--gp-text-tertiary);
  margin: 0;
  line-height: 1.5;
}

/* Warning banner */
.gp-panel__warning {
  background: var(--gp-warning-bg);
  border: 0.5px solid var(--gp-warning-border);
  border-radius: var(--gp-radius-md);
  padding: 10px 12px;
  display: flex;
  gap: 8px;
}
.gp-panel__warning--danger {
  background: var(--gp-danger-bg);
  border-color: var(--gp-danger-border);
}
.gp-panel__warning-icon {
  flex-shrink: 0;
  color: var(--gp-warning-icon);
  margin-top: 1px;
}
.gp-panel__warning--danger .gp-panel__warning-icon {
  color: var(--gp-danger-text);
}
.gp-panel__warning-text {
  font-size: 12px;
  color: var(--gp-warning-text);
  line-height: 1.45;
  margin: 0;
}
.gp-panel__warning--danger .gp-panel__warning-text {
  color: var(--gp-danger-text);
}

/* Notification banner */
.gp-panel__notification {
  background: var(--gp-notification-bg);
  border: 0.5px solid var(--gp-notification-border);
  border-radius: var(--gp-radius-md);
  padding: 10px 12px;
  display: flex;
  gap: 8px;
}
.gp-panel__notification--success {
  background: var(--gp-notification-success-bg);
  border-color: var(--gp-notification-success-border);
}
.gp-panel__notification--danger {
  background: var(--gp-danger-bg);
  border-color: var(--gp-danger-border);
}
.gp-panel__notification-icon {
  flex-shrink: 0;
  color: var(--gp-notification-icon);
  margin-top: 1px;
}
.gp-panel__notification--success .gp-panel__notification-icon {
  color: var(--gp-notification-success-text);
}
.gp-panel__notification--danger .gp-panel__notification-icon {
  color: var(--gp-danger-text);
}
.gp-panel__notification-text {
  font-size: 12px;
  color: var(--gp-notification-text);
  line-height: 1.45;
  margin: 0;
}
.gp-panel__notification--success .gp-panel__notification-text {
  color: var(--gp-notification-success-text);
}
.gp-panel__notification--danger .gp-panel__notification-text {
  color: var(--gp-danger-text);
}

/* Projection card */
.gp-panel__card {
  background: var(--gp-surface);
  border: 0.5px solid var(--gp-border);
  border-radius: var(--gp-radius-md);
  padding: 14px;
}
.gp-panel__card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.gp-panel__card-icon {
  width: 24px;
  height: 24px;
  background: var(--gp-text);
  color: var(--gp-bg);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.gp-panel__card-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--gp-text);
}
.gp-panel__card-byline {
  font-size: 11px;
  color: var(--gp-text-tertiary);
  margin-left: auto;
  font-style: italic;
}
.gp-panel__card-body {
  font-size: 13px;
  color: var(--gp-text-secondary);
  line-height: 1.5;
  margin: 0 0 10px;
}
.gp-panel__card-cta {
  width: 100%;
  background: var(--gp-text);
  color: var(--gp-bg);
  border: none;
  padding: 8px 10px;
  border-radius: var(--gp-radius-md);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 100ms ease;
}
.gp-panel__card-cta:hover { opacity: 0.85; }
.gp-panel__card-cta:active { transform: scale(0.99); }

.gp-panel__projection-num {
  font-size: 26px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  margin: 4px 0 6px;
  color: var(--gp-text);
}
.gp-panel__projection-hint {
  font-size: 11px;
  color: var(--gp-text-tertiary);
  margin: 0;
  line-height: 1.4;
}

/* Tile details */
.gp-panel__tile-section + .gp-panel__tile-section {
  margin-top: 4px;
}
.gp-panel__tile-label {
  font-size: 11px;
  color: var(--gp-text-tertiary);
  margin: 0 0 4px;
  letter-spacing: 0.02em;
}
.gp-panel__tile-line {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 2px 0;
  gap: 8px;
}
.gp-panel__tile-line-name {
  color: var(--gp-text-secondary);
}
.gp-panel__tile-line-val {
  font-variant-numeric: tabular-nums;
  color: var(--gp-text);
  text-align: right;
}

/* ---------- Footer ---------- */
.gp-panel__foot {
  padding: 12px 20px;
  background: var(--gp-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex: 0 0 auto;
}
.gp-panel__restart {
  background: transparent;
  border: none;
  color: var(--gp-text-tertiary);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 6px;
  font-family: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 100ms ease;
}
.gp-panel__restart:hover { color: var(--gp-text-secondary); }
.gp-panel__next {
  background: var(--gp-action-primary);
  color: var(--gp-action-text);
  border: none;
  padding: 8px 16px;
  border-radius: var(--gp-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 100ms ease;
}
.gp-panel__next:hover { opacity: 0.9; }
.gp-panel__next:active { transform: scale(0.99); }
.gp-panel__next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gp-panel__restart:focus-visible,
.gp-panel__next:focus-visible,
.gp-panel__card-cta:focus-visible {
  outline: 2px solid var(--gp-action-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .gp-panel__progress-fill,
  .gp-panel__next,
  .gp-panel__card-cta { transition: none; }
}
`;

class StatusMenu {
  constructor(options = {}) {
    this.options = Object.assign({
      // Header
      turnNumber: 1,
      totalTurns: null,        // null hides progress bar + "N of M"
      showProgress: true,
      budget: 0,
      budgetDelta: null,       // null hides delta line
      budgetLabel: 'Budget',
      currency: '€',
      // Slots
      warning: null,           // { message, severity } | null
      notification: null,      // { message, tone } | null
      body: { type: 'idle' },  // see BODY VARIANTS in header comment
      // Footer
      showRestart: true,
      showNextTurn: true,
      nextTurnLabel: 'Next turn →',
      nextTurnDisabled: false,
      restartLabel: 'Restart game',
      // Callbacks
      onNextTurn: null,
      onRestart: null,
      onProjection: null,
    }, options);

    this.rootEl = null;
    this.containerEl = null;
  }

  static ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('gp-panel-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'gp-panel-styles';
    styleEl.textContent = GAME_PANEL_STYLES;
    document.head.appendChild(styleEl);
  }

  /** Mount into a container (selector string or element). */
  mount(container) {
    StatusMenu.ensureStyles();
    const target = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!target) {
      throw new Error('StatusMenu.mount: container not found');
    }
    this.containerEl = target;
    this.rootEl = document.createElement('div');
    this.rootEl.className = 'gp-panel';
    this.rootEl.innerHTML = this._buildHtml();
    target.appendChild(this.rootEl);
    this._attachHandlers();
    return this;
  }

  /** Re-render with merged options. */
  update(newOptions) {
    Object.assign(this.options, newOptions);
    if (!this.rootEl) return;
    this.rootEl.innerHTML = this._buildHtml();
    this._attachHandlers();
  }

  /** Convenience — replace just the body. */
  setBody(bodyConfig) {
    this.update({ body: bodyConfig });
  }

  /** Convenience — clear body to idle. */
  clearBody() {
    this.update({ body: { type: 'idle' } });
  }

  /** Convenience — set warning banner. */
  setWarning(message, severity = 'warning') {
    this.update({ warning: { message, severity } });
  }

  clearWarning() {
    this.update({ warning: null });
  }

  /** Convenience - set notification banner. */
  setNotification(message, tone = 'info') {
    this.update({ notification: { message, tone } });
  }

  clearNotification() {
    this.update({ notification: null });
  }

  /** Tear down + remove from DOM. */
  destroy() {
    if (this.rootEl && this.rootEl.parentNode) {
      this.rootEl.parentNode.removeChild(this.rootEl);
    }
    this.rootEl = null;
    this.containerEl = null;
  }

  // ────────────────────────────────────────────────────────────────────────
  // INTERNALS
  // ────────────────────────────────────────────────────────────────────────

  _formatMoney(amount) {
    const n = Math.round(Number(amount) || 0);
    const sign = n < 0 ? '−' : '';
    return `${sign}${this.options.currency}${Math.abs(n).toLocaleString()}`;
  }

  _formatDelta(amount) {
    const n = Math.round(Number(amount) || 0);
    if (n === 0) return `${this.options.currency}0`;
    const sign = n > 0 ? '+' : '−';
    return `${sign}${this.options.currency}${Math.abs(n).toLocaleString()}`;
  }

  _escape(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  _buildHtml() {
    return `
      ${this._headerHtml()}
      <div class="gp-panel__divider"></div>
      <div class="gp-panel__body">
        ${this._warningHtml()}
        ${this._notificationHtml()}
        ${this._bodyHtml()}
      </div>
      ${this._footerHtml()}
    `;
  }

  _headerHtml() {
    const o = this.options;
    const showProgress = o.showProgress && o.totalTurns;
    const progressPct = showProgress
      ? Math.min(100, Math.max(0, (o.turnNumber / o.totalTurns) * 100))
      : 0;

    let deltaHtml = '';
    if (o.budgetDelta != null) {
      const d = Number(o.budgetDelta) || 0;
      const cls = d > 0 ? 'gp-panel__budget-delta--up'
                : d < 0 ? 'gp-panel__budget-delta--down'
                        : 'gp-panel__budget-delta--zero';
      deltaHtml = `<span class="gp-panel__budget-delta ${cls}">${this._formatDelta(d)} last turn</span>`;
    }

    return `
      <header class="gp-panel__head">
        <div class="gp-panel__turn-row">
          <span class="gp-panel__turn">Turn ${this._escape(o.turnNumber)}</span>
          ${showProgress ? `<span class="gp-panel__progress-text">${this._escape(o.turnNumber)} of ${this._escape(o.totalTurns)}</span>` : ''}
        </div>
        ${showProgress ? `
          <div class="gp-panel__progress-bar">
            <div class="gp-panel__progress-fill" style="width: ${progressPct}%"></div>
          </div>
        ` : ''}
        <div class="gp-panel__budget-row">
          <span class="gp-panel__budget-label">${this._escape(o.budgetLabel)}</span>
          <span class="gp-panel__budget-num">${this._formatMoney(o.budget)}</span>
        </div>
        <div class="gp-panel__budget-delta-row">${deltaHtml}</div>
      </header>
    `;
  }

  _warningHtml() {
    const w = this.options.warning;
    if (!w || !w.message) return '';
    const isDanger = w.severity === 'danger';
    const cls = isDanger ? 'gp-panel__warning gp-panel__warning--danger' : 'gp-panel__warning';
    return `
      <div class="${cls}" role="alert">
        <svg class="gp-panel__warning-icon" width="14" height="14" viewBox="0 0 14 14" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 1.5L13 12H1z"/>
          <path d="M7 6v2.5M7 10.2v.1"/>
        </svg>
        <p class="gp-panel__warning-text">${this._escape(w.message)}</p>
      </div>
    `;
  }

  _notificationHtml() {
    const n = this.options.notification;
    if (!n || !n.message) return '';
    const tone = n.tone || 'info';
    const toneClass = tone === 'success'
      ? ' gp-panel__notification--success'
      : tone === 'danger'
        ? ' gp-panel__notification--danger'
        : '';
    return `
      <div class="gp-panel__notification${toneClass}" role="status">
        <svg class="gp-panel__notification-icon" width="14" height="14" viewBox="0 0 14 14" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="7" cy="7" r="5.5"/>
          <path d="M7 4.5v3M7 9.5v.1"/>
        </svg>
        <p class="gp-panel__notification-text">${this._escape(n.message)}</p>
      </div>
    `;
  }

  _bodyHtml() {
    const b = this.options.body || { type: 'idle' };
    switch (b.type) {
      case 'hint':
        return `<p class="gp-panel__hint">${this._escape(b.text || '')}</p>`;

      case 'projection-card': {
        const title = this._escape(b.title || 'Revenue projection');
        const byline = b.byline ? `<span class="gp-panel__card-byline">${this._escape(b.byline)}</span>` : '';
        const description = this._escape(
          b.description || 'Estimate next-turn revenue from objects + tickets. Available once per turn.'
        );
        const ctaLabel = this._escape(b.ctaLabel || 'Get projection');
        return `
          <div class="gp-panel__card">
            <div class="gp-panel__card-head">
              <span class="gp-panel__card-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 2v2M7 10v2M2 7h2M10 7h2M3.5 3.5l1.4 1.4M9.1 9.1l1.4 1.4M3.5 10.5l1.4-1.4M9.1 4.9l1.4-1.4"/>
                  <circle cx="7" cy="7" r="2"/>
                </svg>
              </span>
              <span class="gp-panel__card-title">${title}</span>
              ${byline}
            </div>
            <p class="gp-panel__card-body">${description}</p>
            <button class="gp-panel__card-cta" type="button" data-gp-action="projection">${ctaLabel}</button>
          </div>
          <p class="gp-panel__hint">Click a tile to build · hover for details</p>
        `;
      }

      case 'projection-result': {
        const byline = b.byline ? `<span class="gp-panel__card-byline">${this._escape(b.byline)}</span>` : '';
        const title = this._escape(b.title || 'Projection');
        const description = this._escape(b.description || 'Estimated next-turn revenue');
        const hasAmount = b.amount != null && Number.isFinite(Number(b.amount));
        const amountHtml = hasAmount
          ? `<div class="gp-panel__projection-num">${this._formatMoney(b.amount)}</div>`
          : '';
        const hint = b.hint
          ? `<p class="gp-panel__projection-hint">${this._escape(b.hint)}</p>`
          : '';
        return `
          <div class="gp-panel__card">
            <div class="gp-panel__card-head">
              <span class="gp-panel__card-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 2v2M7 10v2M2 7h2M10 7h2M3.5 3.5l1.4 1.4M9.1 9.1l1.4 1.4M3.5 10.5l1.4-1.4M9.1 4.9l1.4-1.4"/>
                  <circle cx="7" cy="7" r="2"/>
                </svg>
              </span>
              <span class="gp-panel__card-title">${title}</span>
              ${byline}
            </div>
            <p class="gp-panel__card-body" style="margin: 0 0 4px;">${description}</p>
            ${amountHtml}
            ${hint}
          </div>
        `;
      }

      case 'tile-details': {
        const sections = (b.sections || []).map(s => `
          <div class="gp-panel__tile-section">
            ${s.label ? `<p class="gp-panel__tile-label">${this._escape(s.label)}</p>` : ''}
            ${(s.lines || []).map(line => `
              <div class="gp-panel__tile-line">
                <span class="gp-panel__tile-line-name">${this._escape(line.name)}</span>
                <span class="gp-panel__tile-line-val">${this._escape(line.value)}</span>
              </div>
            `).join('')}
          </div>
        `).join('');
        return sections || `<p class="gp-panel__hint">No details available</p>`;
      }

      case 'custom':
        return b.html || '';

      case 'idle':
      default:
        return `<p class="gp-panel__hint">Click a tile to build · hover for details</p>`;
    }
  }

  _footerHtml() {
    const o = this.options;
    if (!o.showRestart && !o.showNextTurn) return '';
    const restart = o.showRestart
      ? `<button class="gp-panel__restart" type="button" data-gp-action="restart">${this._escape(o.restartLabel)}</button>`
      : '<span></span>';
    const nextTurn = o.showNextTurn
      ? `<button class="gp-panel__next" type="button" data-gp-action="next-turn"${o.nextTurnDisabled ? ' disabled' : ''}>${this._escape(o.nextTurnLabel)}</button>`
      : '';
    return `
      <footer class="gp-panel__foot">
        ${restart}
        ${nextTurn}
      </footer>
    `;
  }

  _attachHandlers() {
    if (!this.rootEl) return;
    const o = this.options;

    const next = this.rootEl.querySelector('[data-gp-action="next-turn"]');
    if (next) next.addEventListener('click', () => {
      if (typeof o.onNextTurn === 'function') o.onNextTurn();
    });

    const restart = this.rootEl.querySelector('[data-gp-action="restart"]');
    if (restart) restart.addEventListener('click', () => {
      if (typeof o.onRestart === 'function') o.onRestart();
    });

    const projection = this.rootEl.querySelector('[data-gp-action="projection"]');
    if (projection) projection.addEventListener('click', () => {
      if (typeof o.onProjection === 'function') o.onProjection();
    });
  }
}

if (typeof window !== 'undefined') {
  window.StatusMenu = StatusMenu;
  window.GameStatusPanel = StatusMenu;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatusMenu;
}
