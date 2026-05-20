/**
 * PopupPanel — a self-contained modal popup for GreenBee.
 *
 * No dependencies. Vanilla JS + injected stylesheet. Themeable via CSS variables.
 *
 * Two flavors:
 *   - Proposal: actionable, with Accept / Decline buttons.
 *       Built-in types: 'branding', 'wifi'. New types can be added via
 *       PopupPanel.registerType(...).
 *   - Report:   informational, with a single "Got it!" button.
 *       Three severities: 'info' (default), 'warning', 'alert'.
 *       Sender is optional — without one, the popup reads as a system message.
 *
 * USAGE — PROPOSAL
 * ----------------
 *   const popup = new PopupPanel({
 *     item: {
 *       id: 'branding_deal1',
 *       type: 'branding',                 // 'branding' | 'wifi' | (registered type)
 *       sender: 'Northwind Sales',
 *       senderRole: 'Sales team',         // optional, shown under sender name
 *       senderIconUrl: 'https://...',     // optional, takes priority over type icon
 *       turn: 3,                          // optional, appended to senderRole as "Turn N"
 *       title: 'Branding package offer',
 *       preview: 'A branded promotion push for €300 …',  // optional
 *       body: 'Northwind Sales proposes a branding package …',
 *       terms: [
 *         { label: 'Fee', value: '€300' },
 *         { label: 'Primary effect', value: 'Higher sponsor appeal' },
 *       ],
 *       feeLabel: '€300',                 // optional, appended to Accept button
 *       status: 'pending',                // 'pending'|'accepted'|'declined' (default 'pending')
 *     },
 *     onAccept:  (id) => game.acceptDeal(id),
 *     onDecline: (id) => game.declineDeal(id),
 *     onClose:   () => console.log('closed'),
 *   });
 *   popup.show();
 *
 * USAGE — REPORT
 * --------------
 *   new PopupPanel({
 *     item: {
 *       id: 'rep-1',
 *       type: 'report',
 *       severity: 'alert',                // 'info' (default) | 'warning' | 'alert'
 *       sender: 'Operations',             // optional — omit for system messages
 *       senderRole: 'Site report',        // optional
 *       turn: 4,                          // optional
 *       title: 'Catering supplier cancelled',
 *       body: 'The primary catering contract was withdrawn this morning …',
 *     },
 *     onDismiss: (id) => game.markRead(id),
 *   }).show();
 *
 * ADDING NEW PROPOSAL TYPES
 * -------------------------
 *   PopupPanel.registerType('catering', {
 *     kind: 'proposal',
 *     pillLabel: 'Proposal',              // text shown in the type pill
 *     icon: '<svg>...</svg>',             // raw SVG markup; uses currentColor for stroke
 *     avatarTone: 'info',                 // 'info'|'warning'|'danger'|'neutral' (default 'info')
 *   });
 *
 * THEMING
 * -------
 *   Override CSS variables on :root or .popup-backdrop to fit your tokens:
 *     --popup-bg, --popup-surface, --popup-border,
 *     --popup-text, --popup-text-secondary, --popup-text-tertiary,
 *     --popup-cta-bg, --popup-cta-bg-hover, --popup-cta-text,
 *     --popup-danger, --popup-danger-bg,
 *     --popup-warning, --popup-warning-bg,
 *     --popup-info, --popup-info-bg,
 *     --popup-radius-md, --popup-radius-lg,
 *     --popup-backdrop, --popup-z-index, --popup-font-family
 *
 * GRANULAR UPDATES (after .show())
 * --------------------------------
 *   popup.setStatus('accepted');          // updates pill, hides accept/decline
 *   popup.update({ item: { ... } });      // replace item entirely
 *   popup.close();                        // teardown
 */

const POPUP_PANEL_STYLES = `
.popup-backdrop {
  position: fixed;
  inset: 0;
  background: var(--popup-backdrop, rgba(15, 15, 16, 0.55));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--popup-z-index, 200);
  padding: 16px;
  opacity: 0;
  transition: opacity 150ms ease;
  font-family: var(--popup-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif);
  box-sizing: border-box;
}
.popup-backdrop *,
.popup-backdrop *::before,
.popup-backdrop *::after {
  box-sizing: border-box;
}
.popup-backdrop--visible {
  opacity: 1;
}

.popup {
  background: var(--popup-bg, #ffffff);
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 32px);
  border-radius: var(--popup-radius-lg, 12px);
  border: 0.5px solid var(--popup-border, rgba(0, 0, 0, 0.1));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: var(--popup-text, #1a1a1a);
  transform: scale(0.97);
  transition: transform 150ms ease;
}
.popup-backdrop--visible .popup {
  transform: scale(1);
}

/* Severity stripes — reports only */
.popup--severity-danger {
  border-left: 3px solid var(--popup-danger, #B91C1C);
}
.popup--severity-warning {
  border-left: 3px solid var(--popup-warning, #92400E);
}
.popup--severity-info {
  border-left: 3px solid var(--popup-info, #1D4ED8);
}

.popup__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 22px 14px;
  flex-shrink: 0;
}
.popup__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--popup-info-bg, #DBEAFE);
  color: var(--popup-info, #1D4ED8);
}
.popup__avatar--tone-info {
  background: var(--popup-info-bg, #DBEAFE);
  color: var(--popup-info, #1D4ED8);
}
.popup__avatar--tone-warning {
  background: var(--popup-warning-bg, #FEF3C7);
  color: var(--popup-warning, #92400E);
}
.popup__avatar--tone-danger {
  background: var(--popup-danger-bg, #FEE2E2);
  color: var(--popup-danger, #B91C1C);
}
.popup__avatar--tone-neutral {
  background: var(--popup-surface, #f5f5f5);
  color: var(--popup-text-secondary, #6b6b6b);
}
.popup__avatar svg {
  width: 16px;
  height: 16px;
}
.popup__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.popup__sender-info {
  min-width: 0;
  flex: 1;
}
.popup__sender-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--popup-text, #1a1a1a);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.popup__sender-sub {
  font-size: 12px;
  color: var(--popup-text-tertiary, #9a9a9a);
  line-height: 1.3;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popup__pill {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--popup-surface, #f5f5f5);
  color: var(--popup-text-secondary, #6b6b6b);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}
.popup__pill--proposal {
  background: #FAEEDA;
  color: #854F0B;
}
.popup__pill--accepted {
  background: #EAF3DE;
  color: #3B6D11;
}
.popup__pill--declined {
  background: var(--popup-surface, #f5f5f5);
  color: var(--popup-text-tertiary, #9a9a9a);
}
.popup__pill--severity-danger {
  background: var(--popup-danger-bg, #FEE2E2);
  color: var(--popup-danger, #B91C1C);
}
.popup__pill--severity-warning {
  background: var(--popup-warning-bg, #FEF3C7);
  color: var(--popup-warning, #92400E);
}
.popup__pill--severity-info {
  background: var(--popup-info-bg, #DBEAFE);
  color: var(--popup-info, #1D4ED8);
}

.popup__close {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0.5px solid var(--popup-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--popup-radius-md, 8px);
  color: var(--popup-text-secondary, #6b6b6b);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 100ms ease, border-color 100ms ease;
}
.popup__close:hover {
  background: var(--popup-surface, #f5f5f5);
  border-color: var(--popup-text-tertiary, #9a9a9a);
}

.popup__body {
  padding: 0 22px 18px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.popup__title {
  font-size: 18px;
  font-weight: 500;
  color: var(--popup-text, #1a1a1a);
  margin: 0 0 6px;
  line-height: 1.3;
}
.popup__preview {
  font-size: 13px;
  color: var(--popup-text-secondary, #6b6b6b);
  margin: 0 0 14px;
  line-height: 1.55;
}
.popup__text {
  font-size: 13px;
  color: var(--popup-text-secondary, #6b6b6b);
  margin: 0 0 16px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.popup__terms {
  background: var(--popup-surface, #f5f5f5);
  border-radius: var(--popup-radius-md, 8px);
  padding: 4px 14px;
}
.popup__term-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 9px 0;
}
.popup__term-row + .popup__term-row {
  border-top: 0.5px solid var(--popup-border, rgba(0, 0, 0, 0.1));
}
.popup__term-label {
  font-size: 12px;
  color: var(--popup-text-tertiary, #9a9a9a);
}
.popup__term-value {
  font-size: 13px;
  color: var(--popup-text, #1a1a1a);
  font-weight: 500;
  text-align: right;
}

.popup__footer {
  display: flex;
  gap: 8px;
  padding: 14px 22px 18px;
  border-top: 0.5px solid var(--popup-border, rgba(0, 0, 0, 0.1));
  flex-shrink: 0;
}
.popup__btn {
  font-size: 13px;
  font-weight: 500;
  height: 38px;
  padding: 0 14px;
  border-radius: var(--popup-radius-md, 8px);
  cursor: pointer;
  font-family: inherit;
  border: 0.5px solid transparent;
  transition: background 100ms ease, border-color 100ms ease, transform 80ms ease;
}
.popup__btn:active {
  transform: scale(0.97);
}
.popup__btn--accept {
  flex: 1;
  background: var(--popup-cta-bg, #16a34a);
  color: var(--popup-cta-text, #ffffff);
  border-color: var(--popup-cta-bg, #16a34a);
}
.popup__btn--accept:hover {
  background: var(--popup-cta-bg-hover, #098436);
  border-color: var(--popup-cta-bg-hover, #0c8438);
}
.popup__btn--decline {
  flex: 1;
  background: transparent;
  color: var(--popup-text-secondary, #6b6b6b);
  border-color: var(--popup-border, rgba(0, 0, 0, 0.1));
}
.popup__btn--decline:hover {
  background: var(--popup-surface, #f5f5f5);
  border-color: var(--popup-text-tertiary, #9a9a9a);
}
.popup__btn--got-it {
  flex: 1;
  background: var(--popup-cta-bg, #16a34a);
  color: var(--popup-cta-text, #ffffff);
  border-color: var(--popup-cta-bg, #16a34a);
}
.popup__btn--got-it:hover {
  background: var(--popup-cta-bg-hover, #0a7e35);
  border-color: var(--popup-cta-bg-hover, #097e34);
}

.popup__close:focus-visible,
.popup__btn:focus-visible {
  outline: 2px solid var(--popup-cta-bg, #0f7133);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .popup-backdrop,
  .popup,
  .popup__btn,
  .popup__close {
    transition: none;
  }
}
`;

// Default SVG icons — stroke-based, inherit color from parent via currentColor.
const POPUP_ICONS = {
  branding: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8L19 11l-5.1 2.2L12 19l-1.9-5.8L5 11l5.1-2.2z"/></svg>',
  wifi:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/></svg>',
  alert:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  warning:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  info:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

// Type registry. Extensible via PopupPanel.registerType().
const POPUP_TYPES = {
  branding: { kind: 'proposal', pillLabel: 'Proposal', icon: POPUP_ICONS.branding, avatarTone: 'info' },
  wifi:     { kind: 'proposal', pillLabel: 'Proposal', icon: POPUP_ICONS.wifi,     avatarTone: 'info' },
};

const POPUP_SEVERITIES = {
  alert:   { tone: 'danger',  pillLabel: 'Alert',   icon: POPUP_ICONS.alert },
  warning: { tone: 'warning', pillLabel: 'Warning', icon: POPUP_ICONS.warning },
  info:    { tone: 'info',    pillLabel: 'Info',    icon: POPUP_ICONS.info },
};

class PopupPanel {
  constructor(options = {}) {
    this.options = Object.assign({
      item: null,
      onAccept: null,      // (id) => void  — host decides; popup auto-closes if autoClose
      onDecline: null,     // (id) => void
      onDismiss: null,     // (id) => void  — fired on Got it for reports
      onClose: null,       // () => void    — fired on any teardown
      autoClose: true,     // close popup after accept/decline/dismiss
      dismissible: true,   // ESC + backdrop click + close button
    }, options);

    this.rootEl = null;
    this.backdropEl = null;
    this._previouslyFocused = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  static ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('popup-panel-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'popup-panel-styles';
    styleEl.textContent = POPUP_PANEL_STYLES;
    document.head.appendChild(styleEl);
  }

  /** Register a new proposal type (or override an existing one). */
  static registerType(typeName, config) {
    POPUP_TYPES[typeName] = Object.assign({
      kind: 'proposal',
      pillLabel: 'Proposal',
      avatarTone: 'info',
      icon: POPUP_ICONS.branding,
    }, config);
  }

  show() {
    if (this.rootEl) return this;
    PopupPanel.ensureStyles();
    this._previouslyFocused = document.activeElement;
    this.backdropEl = this._buildBackdrop();
    this.rootEl = this.backdropEl;
    document.body.appendChild(this.backdropEl);
    document.addEventListener('keydown', this._handleKeyDown);
    requestAnimationFrame(() => {
      this.backdropEl.classList.add('popup-backdrop--visible');
      // Focus the primary action so Enter accepts / dismisses.
      const primary = this.backdropEl.querySelector('.popup__btn--accept, .popup__btn--got-it');
      if (primary) {
        primary.focus();
      } else {
        const closeBtn = this.backdropEl.querySelector('[data-popup-action="close"]');
        if (closeBtn) closeBtn.focus();
      }
    });
    return this;
  }

  close() {
    if (!this.rootEl) return;
    document.removeEventListener('keydown', this._handleKeyDown);
    const el = this.backdropEl;
    el.classList.remove('popup-backdrop--visible');
    this.backdropEl = null;
    this.rootEl = null;
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 150);
    if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
      this._previouslyFocused.focus();
    }
    if (typeof this.options.onClose === 'function') {
      this.options.onClose();
    }
  }

  // ───────────────── granular updates ─────────────────

  /** Update the item's status: 'pending' | 'accepted' | 'declined'. */
  setStatus(status) {
    if (!this.options.item) return;
    this.options.item.status = status;
    this._rerender();
  }

  /** Replace the item or other options entirely and re-render. */
  update(newOptions) {
    Object.assign(this.options, newOptions);
    this._rerender();
  }

  // ───────────────── internals ─────────────────

  _rerender() {
    if (!this.rootEl) return;
    const card = this.rootEl.querySelector('.popup');
    if (!card) return;
    const newCard = document.createElement('div');
    newCard.innerHTML = this._buildCardHtml().trim();
    if (newCard.firstElementChild) card.replaceWith(newCard.firstElementChild);
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.options.dismissible) {
      e.stopPropagation();
      this.close();
    }
  }

  _escape(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  _getTypeConfig() {
    const item = this.options.item;
    if (!item) return null;
    if (item.type === 'report') {
      const sev = POPUP_SEVERITIES[item.severity] || POPUP_SEVERITIES.info;
      return { kind: 'report', ...sev };
    }
    return POPUP_TYPES[item.type] || null;
  }

  _isProposal() {
    const cfg = this._getTypeConfig();
    return !!cfg && cfg.kind === 'proposal';
  }

  _isReport() {
    const cfg = this._getTypeConfig();
    return !!cfg && cfg.kind === 'report';
  }

  _getInitials(name) {
    if (!name) return '';
    const words = String(name).trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  _buildBackdrop() {
    const backdrop = document.createElement('div');
    backdrop.className = 'popup-backdrop';
    backdrop.innerHTML = this._buildCardHtml();

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop && this.options.dismissible) {
        this.close();
        return;
      }
      this._handleDelegatedClick(e);
    });

    return backdrop;
  }

  _buildCardHtml() {
    const item = this.options.item;
    if (!item) {
      return `<div class="popup" role="dialog" aria-modal="true"></div>`;
    }

    const cfg = this._getTypeConfig();
    const isReport = this._isReport();
    const isProposal = this._isProposal();

    const classes = ['popup'];
    if (isReport && cfg && cfg.tone) {
      classes.push(`popup--severity-${cfg.tone}`);
    }

    return `
      <div class="${classes.join(' ')}" role="dialog" aria-modal="true" aria-labelledby="popup-title">
        ${this._buildHeadHtml(item, cfg, isReport, isProposal)}
        ${this._buildBodyHtml(item, isProposal)}
        ${this._buildFooterHtml(item, isReport, isProposal)}
      </div>
    `;
  }

  _buildHeadHtml(item, cfg, isReport, isProposal) {
    const hasSender = !!item.sender;

    // Avatar
    let avatarHtml = '';
    let avatarToneClass = '';

    if (isReport) {
      avatarToneClass = `popup__avatar--tone-${cfg.tone}`;
    } else if (isProposal && cfg) {
      avatarToneClass = `popup__avatar--tone-${cfg.avatarTone || 'info'}`;
    } else {
      avatarToneClass = 'popup__avatar--tone-neutral';
    }

    if (hasSender && item.senderIconUrl) {
      avatarHtml = `<img src="${this._escape(item.senderIconUrl)}" alt="">`;
    } else if (hasSender && isProposal && cfg && cfg.icon) {
      avatarHtml = cfg.icon;
    } else if (hasSender) {
      avatarHtml = this._escape(this._getInitials(item.sender));
    } else if (cfg && cfg.icon) {
      // Senderless: use the type/severity icon
      avatarHtml = cfg.icon;
      if (isReport) {
        // already toned
      } else {
        avatarToneClass = 'popup__avatar--tone-neutral';
      }
    } else {
      avatarHtml = '';
      avatarToneClass = 'popup__avatar--tone-neutral';
    }

    // Sender info block
    const senderName = hasSender ? item.sender : 'System';
    const turnText = item.turn != null ? `Turn ${this._escape(item.turn)}` : '';
    const roleText = item.senderRole ? this._escape(item.senderRole) : (hasSender ? '' : 'No sender');
    const subParts = [turnText, roleText].filter(Boolean);
    const subText = subParts.join(' · ');

    // Pill
    let pillHtml = '';
    if (isProposal && cfg) {
      const status = item.status || 'pending';
      if (status === 'accepted') {
        pillHtml = `<span class="popup__pill popup__pill--accepted">Accepted</span>`;
      } else if (status === 'declined') {
        pillHtml = `<span class="popup__pill popup__pill--declined">Declined</span>`;
      } else {
        pillHtml = `<span class="popup__pill popup__pill--proposal">${this._escape(cfg.pillLabel)}</span>`;
      }
    } else if (isReport && cfg) {
      pillHtml = `<span class="popup__pill popup__pill--severity-${cfg.tone}">${this._escape(cfg.pillLabel)}</span>`;
    }

    return `
      <div class="popup__head">
        <div class="popup__avatar ${avatarToneClass}">${avatarHtml}</div>
        <div class="popup__sender-info">
          <div class="popup__sender-name">${this._escape(senderName)}</div>
          ${subText ? `<div class="popup__sender-sub">${subText}</div>` : ''}
        </div>
        ${pillHtml}
      </div>
    `;
  }

  _buildBodyHtml(item, isProposal) {
    const previewHtml = item.preview ? `<p class="popup__preview">${this._escape(item.preview)}</p>` : '';
    const bodyHtml    = item.body    ? `<p class="popup__text">${this._escape(item.body)}</p>`       : '';

    let termsHtml = '';
    if (isProposal && Array.isArray(item.terms) && item.terms.length > 0) {
      const rows = item.terms.map(t => `
        <div class="popup__term-row">
          <span class="popup__term-label">${this._escape(t.label)}</span>
          <span class="popup__term-value">${this._escape(t.value)}</span>
        </div>
      `).join('');
      termsHtml = `<div class="popup__terms">${rows}</div>`;
    }

    return `
      <div class="popup__body">
        ${item.title ? `<h3 class="popup__title" id="popup-title">${this._escape(item.title)}</h3>` : ''}
        ${previewHtml}
        ${bodyHtml}
        ${termsHtml}
      </div>
    `;
  }

  _buildFooterHtml(item, isReport, isProposal) {
    if (isReport) {
      return `
        <div class="popup__footer">
          <button class="popup__btn popup__btn--got-it" type="button" data-popup-action="dismiss">Got it!</button>
        </div>
      `;
    }

    if (isProposal) {
      const status = item.status || 'pending';
      if (status !== 'pending') {
        // Already resolved — show a single close button
        return `
          <div class="popup__footer">
            <button class="popup__btn popup__btn--decline" type="button" data-popup-action="close" style="flex:1;">Close</button>
          </div>
        `;
      }
      const feeSuffix = item.feeLabel ? ` · ${this._escape(item.feeLabel)}` : '';
      return `
        <div class="popup__footer">
          <button class="popup__btn popup__btn--decline" type="button" data-popup-action="decline">Decline</button>
          <button class="popup__btn popup__btn--accept" type="button" data-popup-action="accept">Accept${feeSuffix}</button>
        </div>
      `;
    }

    return '';
  }

  _handleDelegatedClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const actionEl = target.closest('[data-popup-action]');
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-popup-action');
    const id = this.options.item ? this.options.item.id : null;

    if (action === 'close') {
      this.close();
      return;
    }
    if (action === 'accept') {
      if (typeof this.options.onAccept === 'function') this.options.onAccept(id);
      if (this.options.autoClose) this.close();
      return;
    }
    if (action === 'decline') {
      if (typeof this.options.onDecline === 'function') this.options.onDecline(id);
      if (this.options.autoClose) this.close();
      return;
    }
    if (action === 'dismiss') {
      if (typeof this.options.onDismiss === 'function') this.options.onDismiss(id);
      if (this.options.autoClose) this.close();
      return;
    }
  }
}

if (typeof window !== 'undefined') {
  window.PopupPanel = PopupPanel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopupPanel;
}
