/**
 * InboxPanel — a self-contained inbox / news-and-reports modal for GreenBee.
 *
 * No dependencies. Vanilla JS + injected stylesheet. Themeable via CSS variables.
 *
 * Renders a modal-style inbox with three item types:
 *   - 'report'   — informational, expandable to full body, no actions
 *   - 'proposal' — actionable, expandable, has Accept / Decline buttons + status
 *   - 'news'     — informational, like report but visually neutral (gray tile)
 *
 * USAGE
 * -----
 *   const inbox = new InboxPanel({
 *     items: [
 *       {
 *         id: 'r-1',
 *         type: 'report',
 *         sender: 'Assistant',
 *         turn: 12,
 *         title: 'Marketing channel insight',
 *         preview: 'Your billboards are underperforming…',
 *         body: 'Full report text shown when expanded.',
 *       },
 *       {
 *         id: 'p-1',
 *         type: 'proposal',
 *         sender: 'Local brewery',
 *         turn: 12,
 *         title: 'Sponsor deal — €400 per turn',
 *         body: 'Logo placement on Booth #2 for 5 turns.',
 *         expiresInTurns: 2,
 *         terms: [
 *           { label: 'Income',   value: '€400/turn' },
 *           { label: 'Duration', value: '5 turns'   },
 *           { label: 'Booth',    value: '#2'        },
 *         ],
 *       },
 *     ],
 *     onAccept:   (id) => { game.applyDeal(id); inbox.setItemStatus(id, 'accepted'); },
 *     onDecline:  (id) => inbox.setItemStatus(id, 'declined'),
 *     onItemRead: (id) => game.markRead(id),
 *     onClose:    () => console.log('inbox closed'),
 *   });
 *   inbox.show();
 *
 *   // later, granular updates:
 *   inbox.addItem({ id: 'r-2', type: 'report', sender: 'Sales team', ... });
 *   inbox.setItemRead('r-1', true);
 *   inbox.setItemStatus('p-1', 'accepted');
 *   inbox.removeItem('p-1');
 *
 *   // full re-render:
 *   inbox.update({ items: [...] });
 *
 *   // teardown:
 *   inbox.close();
 *
 * ITEM SCHEMA
 * -----------
 *   {
 *     id:       string,                 // required, unique
 *     type:     'report'|'proposal'|'news',
 *     sender:   string,                 // shown in meta row
 *     title:    string,                 // bold line
 *     preview:  string,                 // optional, shown when collapsed
 *     body:     string,                 // optional, shown when expanded
 *     turn:     number,                 // optional, formatted as "Turn N"
 *     timestamp: string,                // optional, used instead of `turn` if set
 *     read:     boolean,                // default false
 *     icon:     string,                 // optional, raw <svg>...</svg> override
 *
 *     // proposal-only
 *     status:           'pending'|'accepted'|'declined'|'expired', // default 'pending'
 *     expiresInTurns:   number,         // optional, shows warning if <= 1
 *     terms:            [{ label, value }, ...],  // optional metadata grid
 *   }
 *
 * THEMING
 * -------
 *   Override any of these CSS variables on :root or .inbox to fit your tokens:
 *     --inbox-bg, --inbox-surface, --inbox-border,
 *     --inbox-text, --inbox-text-secondary, --inbox-text-tertiary,
 *     --inbox-success,
 *     --inbox-cta-bg, --inbox-cta-bg-hover, --inbox-cta-text,
 *     --inbox-radius-md, --inbox-radius-lg,
 *     --inbox-backdrop, --inbox-z-index, --inbox-font-family
 */

const INBOX_PANEL_STYLES = `
.inbox-backdrop {
  position: fixed;
  inset: 0;
  background: var(--inbox-backdrop, rgba(0, 0, 0, 0.45));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--inbox-z-index, 9999);
  padding: 16px;
  opacity: 0;
  transition: opacity 150ms ease;
  font-family: var(--inbox-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif);
  box-sizing: border-box;
}
.inbox-backdrop *,
.inbox-backdrop *::before,
.inbox-backdrop *::after {
  box-sizing: border-box;
}
.inbox-backdrop--visible {
  opacity: 1;
}
.inbox {
  background: var(--inbox-bg, #ffffff);
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 32px);
  border-radius: var(--inbox-radius-lg, 12px);
  border: 0.5px solid var(--inbox-border, rgba(0, 0, 0, 0.1));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: var(--inbox-text, #1a1a1a);
  transform: scale(0.97);
  transition: transform 150ms ease;
}
.inbox-backdrop--visible .inbox {
  transform: scale(1);
}
.inbox--popover {
  max-width: none;
  max-height: min(72vh, 560px);
  transform: none;
}

.inbox__header {
  flex-shrink: 0;
  padding: 18px 22px 16px;
  border-bottom: 0.5px solid var(--inbox-border, rgba(0, 0, 0, 0.1));
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.inbox__title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--inbox-text, #1a1a1a);
}
.inbox__subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--inbox-text-tertiary, #9a9a9a);
  line-height: 1.4;
}
.inbox__close {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0.5px solid var(--inbox-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--inbox-radius-md, 8px);
  color: var(--inbox-text-secondary, #6b6b6b);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 100ms ease, border-color 100ms ease;
}
.inbox__close:hover {
  background: var(--inbox-surface, #f5f5f5);
  border-color: var(--inbox-text-tertiary, #9a9a9a);
}

.inbox__filters {
  flex-shrink: 0;
  padding: 12px 22px;
  border-bottom: 0.5px solid var(--inbox-border, rgba(0, 0, 0, 0.1));
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.inbox__filter {
  font-size: 12px;
  padding: 5px 12px;
  background: transparent;
  color: var(--inbox-text-secondary, #6b6b6b);
  border: 0.5px solid var(--inbox-border, rgba(0, 0, 0, 0.1));
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  transition: background 100ms ease, color 100ms ease, border-color 100ms ease;
}
.inbox__filter:hover {
  border-color: var(--inbox-text-tertiary, #9a9a9a);
}
.inbox__filter--active {
  background: var(--inbox-text, #1a1a1a);
  color: var(--inbox-bg, #ffffff);
  border-color: var(--inbox-text, #1a1a1a);
  font-weight: 500;
}
.inbox__filter-count {
  opacity: 0.6;
  margin-left: 2px;
}
.inbox__filter--active .inbox__filter-count {
  opacity: 0.7;
}

.inbox__list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.inbox__empty {
  padding: 48px 22px;
  text-align: center;
  color: var(--inbox-text-tertiary, #9a9a9a);
  font-size: 13px;
}

.inbox__item {
  border-bottom: 0.5px solid var(--inbox-border, rgba(0, 0, 0, 0.1));
}
.inbox__item:last-child {
  border-bottom: none;
}
.inbox__item--expanded {
  background: var(--inbox-surface, #f5f5f5);
}

.inbox__item-header {
  padding: 14px 22px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  cursor: pointer;
  transition: background 80ms ease;
}
.inbox__item:not(.inbox__item--expanded) .inbox__item-header:hover {
  background: var(--inbox-surface, #f5f5f5);
}

.inbox__item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.inbox__item-icon svg {
  width: 16px;
  height: 16px;
}
.inbox__item--resolved .inbox__item-icon {
  opacity: 0.6;
}

.inbox__item-body {
  flex: 1;
  min-width: 0;
}
.inbox__item-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}
.inbox__item-sender-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.inbox__item-dot {
  width: 6px;
  height: 6px;
  background: var(--inbox-success, #639922);
  border-radius: 50%;
  flex-shrink: 0;
}
.inbox__item-sender {
  font-size: 13px;
  font-weight: 500;
  color: var(--inbox-text, #1a1a1a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.inbox__item--read .inbox__item-sender,
.inbox__item--resolved .inbox__item-sender {
  font-weight: 400;
  color: var(--inbox-text-secondary, #6b6b6b);
}
.inbox__item-pill {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
}
.inbox__item-pill--proposal {
  background: #FAEEDA;
  color: #854F0B;
}
.inbox__item-pill--accepted {
  background: #EAF3DE;
  color: #3B6D11;
}
.inbox__item-pill--declined,
.inbox__item-pill--expired {
  background: var(--inbox-surface, #f5f5f5);
  color: var(--inbox-text-tertiary, #9a9a9a);
}
.inbox__item-turn {
  font-size: 11px;
  color: var(--inbox-text-tertiary, #9a9a9a);
  flex-shrink: 0;
}
.inbox__item-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
  color: var(--inbox-text, #1a1a1a);
}
.inbox__item--read .inbox__item-title {
  color: var(--inbox-text, #1a1a1a);
}
.inbox__item--resolved .inbox__item-title {
  color: var(--inbox-text-secondary, #6b6b6b);
  font-weight: 400;
}
.inbox__item-preview {
  font-size: 12px;
  color: var(--inbox-text-secondary, #6b6b6b);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inbox__item-detail {
  padding: 0 22px 14px 56px;
}
.inbox__item-body-text {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--inbox-text-secondary, #6b6b6b);
  line-height: 1.5;
  white-space: pre-wrap;
}
.inbox__item-warning {
  display: inline-block;
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 500;
  color: #854F0B;
  background: #FAEEDA;
  padding: 4px 10px;
  border-radius: var(--inbox-radius-md, 8px);
}
.inbox__item-warning--muted {
  color: var(--inbox-text-tertiary, #9a9a9a);
  background: transparent;
  padding: 0;
  font-weight: 400;
}

.inbox__terms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 6px;
  margin-bottom: 12px;
}
.inbox__term {
  padding: 8px 10px;
  background: var(--inbox-bg, #ffffff);
  border-radius: var(--inbox-radius-md, 8px);
}
.inbox__term-label {
  font-size: 10px;
  color: var(--inbox-text-tertiary, #9a9a9a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}
.inbox__term-value {
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--inbox-text, #1a1a1a);
}

.inbox__actions {
  display: flex;
  gap: 8px;
}
.inbox__btn {
  font-size: 12px;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: var(--inbox-radius-md, 8px);
  cursor: pointer;
  font-family: inherit;
  border: 0.5px solid transparent;
  transition: background 100ms ease, border-color 100ms ease, transform 80ms ease;
}
.inbox__btn:active {
  transform: scale(0.97);
}
.inbox__btn--primary {
  background: var(--inbox-cta-bg, #3B6D11);
  color: var(--inbox-cta-text, #ffffff);
  border-color: var(--inbox-cta-bg, #3B6D11);
}
.inbox__btn--primary:hover {
  background: var(--inbox-cta-bg-hover, #27500A);
  border-color: var(--inbox-cta-bg-hover, #27500A);
}
.inbox__btn--secondary {
  background: transparent;
  color: var(--inbox-text-secondary, #6b6b6b);
  border-color: var(--inbox-border, rgba(0, 0, 0, 0.1));
}
.inbox__btn--secondary:hover {
  background: var(--inbox-bg, #ffffff);
  border-color: var(--inbox-text-tertiary, #9a9a9a);
}

.inbox__close:focus-visible,
.inbox__filter:focus-visible,
.inbox__btn:focus-visible {
  outline: 2px solid var(--inbox-cta-bg, #3B6D11);
  outline-offset: 2px;
}
.inbox__item-header:focus-visible {
  outline: 2px solid var(--inbox-cta-bg, #3B6D11);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  .inbox-backdrop,
  .inbox,
  .inbox__btn,
  .inbox__filter,
  .inbox__item-header {
    transition: none;
  }
}
`;

// Default tile colors per item type — bg + stroke from the same color family.
const INBOX_TILE_COLORS = {
  report:   { bg: '#EAF3DE', stroke: '#3B6D11' },
  proposal: { bg: '#FAEEDA', stroke: '#854F0B' },
  news:     { bg: '#F1EFE8', stroke: '#5F5E5A' },
};

// Default SVG icons.
// Sender keys (lowercase) take priority; falls back to `_${type}`.
const INBOX_DEFAULT_ICONS = {
  'assistant':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
  'sales team': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  '_report':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
  '_proposal':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>',
  '_news':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
};

class InboxPanel {
  constructor(options = {}) {
    this.options = Object.assign({
      title: 'Inbox',
      items: [],
      filters: ['all', 'reports', 'proposals', 'news', 'accepted'],
      activeFilter: 'all',
      filterLabels: {
        all: 'All active',
        reports: 'Reports',
        proposals: 'Proposals',
        news: 'News',
        accepted: 'Accepted'
      },
      emptyText: 'Nothing to see here — check back next turn.',
      dismissible: true,        // ESC + backdrop click
      mountTo: null,            // DOM element or selector; when set, render as an anchored popover instead of a modal
      autoMarkRead: true,       // mark unread items as read when expanded
      onItemRead: null,         // (id) => void
      onAccept: null,           // (id) => void  — host decides whether to flip status
      onDecline: null,          // (id) => void
      onClose: null,
    }, options);

    this._activeFilter = this.options.activeFilter;
    this._expandedId = null;
    this.rootEl = null;
    this.containerEl = null;
    this.backdropEl = null;
    this._previouslyFocused = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  static ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('inbox-panel-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'inbox-panel-styles';
    styleEl.textContent = INBOX_PANEL_STYLES;
    document.head.appendChild(styleEl);
  }

  show() {
    if (this.rootEl) return this;
    InboxPanel.ensureStyles();
    const container = this._resolveContainer();
    if (container) {
      this.containerEl = container;
      this.rootEl = this._buildPopover();
      container.appendChild(this.rootEl);
      return this;
    }

    this._previouslyFocused = document.activeElement;
    this.backdropEl = this._buildBackdrop();
    this.rootEl = this.backdropEl;
    document.body.appendChild(this.backdropEl);
    document.addEventListener('keydown', this._handleKeyDown);
    requestAnimationFrame(() => {
      this.backdropEl.classList.add('inbox-backdrop--visible');
      const closeBtn = this.backdropEl.querySelector('[data-inbox-action="close"]');
      if (closeBtn) closeBtn.focus();
    });
    return this;
  }

  close() {
    if (!this.rootEl) return;
    document.removeEventListener('keydown', this._handleKeyDown);
    if (!this.backdropEl) {
      const el = this.rootEl;
      this.rootEl = null;
      this.containerEl = null;
      if (el.parentNode) el.parentNode.removeChild(el);
      if (typeof this.options.onClose === 'function') {
        this.options.onClose();
      }
      return;
    }

    const el = this.backdropEl;
    el.classList.remove('inbox-backdrop--visible');
    this.backdropEl = null;
    this.rootEl = null;
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

  // ───────────────── granular updates ─────────────────

  /** Mark an item read or unread without re-rendering the whole modal. */
  setItemRead(id, read) {
    const item = this._findItem(id);
    if (!item) return;
    item.read = !!read;
    this._renderHeader();
    this._renderItems();
  }

  /** Update a proposal's status: 'pending' | 'accepted' | 'declined' | 'expired'. */
  setItemStatus(id, status) {
    const item = this._findItem(id);
    if (!item) return;
    item.status = status;
    this._renderHeader();
    this._renderFilters();
    this._renderItems();
  }

  /** Add a new item to the top of the list. */
  addItem(item) {
    this.options.items.unshift(item);
    if (!this.backdropEl) return;
    this._renderHeader();
    this._renderFilters();
    this._renderItems();
  }

  /** Remove an item by id. */
  removeItem(id) {
    this.options.items = this.options.items.filter(i => i.id !== id);
    if (this._expandedId === id) this._expandedId = null;
    if (!this.backdropEl) return;
    this._renderHeader();
    this._renderFilters();
    this._renderItems();
  }

  /** Programmatically change the active filter. */
  setFilter(filter) {
    this._setFilter(filter);
  }

  /** Programmatically expand or collapse an item. */
  expandItem(id) {
    const item = this._findItem(id);
    if (!item) return;
    if (this._expandedId !== id) this._toggleExpand(id);
  }
  collapseAll() {
    if (this._expandedId == null) return;
    this._expandedId = null;
    this._renderItems();
  }

  /** Full re-render with new options merged in. */
  update(newOptions) {
    Object.assign(this.options, newOptions);
    if ('activeFilter' in newOptions) this._activeFilter = newOptions.activeFilter;
    if (!this.rootEl) return;
    const modal = this.rootEl.classList.contains('inbox') ? this.rootEl : this.rootEl.querySelector('.inbox');
    if (modal) modal.innerHTML = this._buildModalContentHtml();
  }

  // ───────────────── internals ─────────────────

  _resolveContainer() {
    const m = this.options.mountTo;
    if (!m) return null;
    if (typeof m === 'string') return document.querySelector(m);
    return m;
  }

  _findItem(id) {
    return (this.options.items || []).find(i => i.id === id);
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

  _cssEscape(value) {
    const s = String(value == null ? '' : value);
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
    return s.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  _buildBackdrop() {
    const backdrop = document.createElement('div');
    backdrop.className = 'inbox-backdrop';
    backdrop.innerHTML = `<div class="inbox" role="dialog" aria-modal="true" aria-labelledby="inbox-title">${this._buildModalContentHtml()}</div>`;

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop && this.options.dismissible) {
        this.close();
        return;
      }
      this._handleDelegatedClick(e);
    });

    return backdrop;
  }

  _buildPopover() {
    const panel = document.createElement('div');
    panel.className = 'inbox inbox--popover';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', this.options.title);
    panel.innerHTML = this._buildModalContentHtml();
    panel.addEventListener('click', (e) => this._handleDelegatedClick(e));
    return panel;
  }

  _buildModalContentHtml() {
    return `
      ${this._buildHeaderHtml()}
      ${this._buildFiltersHtml()}
      <div class="inbox__list" data-inbox-list>${this._buildItemsHtml()}</div>
    `;
  }

  _buildHeaderHtml() {
    const items = this.options.items || [];
    const total = items.length;
    const unread = items.filter(i => !i.read).length;
    const itemNoun = total === 1 ? 'item' : 'items';
    const subtitle = `${total} ${itemNoun}${unread > 0 ? ` · ${unread} unread` : ''}`;

    return `
      <div class="inbox__header" data-inbox-header>
        <div>
          <h3 class="inbox__title" id="inbox-title">${this._escape(this.options.title)}</h3>
          <p class="inbox__subtitle">${this._escape(subtitle)}</p>
        </div>
        <button class="inbox__close" type="button" aria-label="Close" data-inbox-action="close">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  _buildFiltersHtml() {
    const items = this.options.items || [];
    const filters = this.options.filters || ['all'];
    const labels = this.options.filterLabels || {};

    const isAccepted = i => i.type === 'proposal' && i.status === 'accepted';
    const counts = {
      all:       items.filter(i => !isAccepted(i)).length,
      reports:   items.filter(i => i.type === 'report').length,
      proposals: items.filter(i => i.type === 'proposal' && !isAccepted(i)).length,
      news:      items.filter(i => i.type === 'news').length,
      accepted:  items.filter(isAccepted).length,
    };

    const pillsHtml = filters.map(f => {
      const isActive = this._activeFilter === f;
      const cls = `inbox__filter${isActive ? ' inbox__filter--active' : ''}`;
      const count = counts[f] != null ? counts[f] : 0;
      return `
        <button class="${cls}" type="button" data-inbox-filter="${this._escape(f)}">
          ${this._escape(labels[f] || f)}<span class="inbox__filter-count">${count}</span>
        </button>
      `;
    }).join('');

    return `<div class="inbox__filters" data-inbox-filters>${pillsHtml}</div>`;
  }

  _filteredItems() {
    const isAccepted = i => i.type === 'proposal' && i.status === 'accepted';
    if (this._activeFilter === 'all') return this.options.items.filter(i => !isAccepted(i));
    if (this._activeFilter === 'accepted') return this.options.items.filter(isAccepted);
    const typeMap = { reports: 'report', proposals: 'proposal', news: 'news' };
    const targetType = typeMap[this._activeFilter];
    if (!targetType) return this.options.items.slice();
    if (this._activeFilter === 'proposals') return this.options.items.filter(i => i.type === 'proposal' && !isAccepted(i));
    return this.options.items.filter(i => i.type === targetType);
  }

  _buildItemsHtml() {
    const items = this._filteredItems();
    if (items.length === 0) {
      return `<div style="height:240px;" class="inbox__empty">${this._escape(this.options.emptyText)}</div>`;
    }
    return `<div style="height:240px; overflow-y:auto;">${items.map(i => this._buildItemHtml(i)).join('')}</div>`;
  }

  _buildItemHtml(item) {
    const isExpanded = this._expandedId === item.id;
    const isRead     = !!item.read;
    const status     = item.status || 'pending';
    const isResolved = item.type === 'proposal' && status !== 'pending';

    const classes = ['inbox__item'];
    if (isExpanded) classes.push('inbox__item--expanded');
    if (isRead)     classes.push('inbox__item--read');
    if (isResolved) classes.push('inbox__item--resolved');

    const tile = INBOX_TILE_COLORS[item.type] || INBOX_TILE_COLORS.report;
    const iconHtml = item.icon
      || INBOX_DEFAULT_ICONS[String(item.sender || '').toLowerCase()]
      || INBOX_DEFAULT_ICONS[`_${item.type}`]
      || INBOX_DEFAULT_ICONS._report;

    const turnLabel = item.timestamp != null
      ? item.timestamp
      : (item.turn != null ? `Turn ${item.turn}` : '');

    // Status pill (proposals only)
    let pillHtml = '';
    if (item.type === 'proposal') {
      if (status === 'pending') {
        pillHtml = `<span class="inbox__item-pill inbox__item-pill--proposal">Proposal</span>`;
      } else if (status === 'accepted') {
        pillHtml = `<span class="inbox__item-pill inbox__item-pill--accepted">Accepted</span>`;
      } else if (status === 'declined') {
        pillHtml = `<span class="inbox__item-pill inbox__item-pill--declined">Declined</span>`;
      } else if (status === 'expired') {
        pillHtml = `<span class="inbox__item-pill inbox__item-pill--expired">Expired</span>`;
      }
    }

    const dotHtml = !isRead ? `<span class="inbox__item-dot"></span>` : '';

    // Collapsed-only preview line
    let previewHtml = '';
    if (!isExpanded) {
      const previewText = item.preview || (item.body ? this._truncate(item.body, 100) : '');
      if (previewText) {
        previewHtml = `<div class="inbox__item-preview">${this._escape(previewText)}</div>`;
      }
    }

    // Expanded detail
    let detailHtml = '';
    if (isExpanded) {
      const bodyText = item.body || item.preview || '';

      // Expiry warning (pending proposals only)
      let warningHtml = '';
      if (item.type === 'proposal' && status === 'pending' && item.expiresInTurns != null) {
        const t = Math.round(Number(item.expiresInTurns));
        let text = '';
        let urgent = false;
        if (t <= 0)      { text = 'Expires this turn'; urgent = true; }
        else if (t === 1){ text = 'Expires next turn'; urgent = true; }
        else             { text = `Expires in ${t} turns`; urgent = false; }
        const cls = `inbox__item-warning${urgent ? '' : ' inbox__item-warning--muted'}`;
        warningHtml = `<div class="${cls}">${this._escape(text)}</div>`;
      }

      // Terms grid
      let termsHtml = '';
      if (Array.isArray(item.terms) && item.terms.length > 0) {
        const cells = item.terms.map(t => `
          <div class="inbox__term">
            <div class="inbox__term-label">${this._escape(t.label)}</div>
            <div class="inbox__term-value">${this._escape(t.value)}</div>
          </div>
        `).join('');
        termsHtml = `<div class="inbox__terms">${cells}</div>`;
      }

      // Action buttons (pending proposals only)
      let actionsHtml = '';
      if (item.type === 'proposal' && status === 'pending') {
        actionsHtml = `
          <div class="inbox__actions">
            <button class="inbox__btn inbox__btn--primary"   type="button" data-inbox-accept="${this._escape(item.id)}">Accept</button>
            <button class="inbox__btn inbox__btn--secondary" type="button" data-inbox-decline="${this._escape(item.id)}">Decline</button>
          </div>
        `;
      }

      detailHtml = `
        <div class="inbox__item-detail">
          ${bodyText ? `<p class="inbox__item-body-text">${this._escape(bodyText)}</p>` : ''}
          ${warningHtml}
          ${termsHtml}
          ${actionsHtml}
        </div>
      `;
    }

    return `
      <div class="${classes.join(' ')}" data-inbox-item="${this._escape(item.id)}">
        <div class="inbox__item-header" data-inbox-toggle="${this._escape(item.id)}" tabindex="0" role="button" aria-expanded="${isExpanded}">
          <div class="inbox__item-icon" style="background: ${tile.bg}; color: ${tile.stroke};">
            ${iconHtml}
          </div>
          <div class="inbox__item-body">
            <div class="inbox__item-meta">
              <div class="inbox__item-sender-wrap">
                ${dotHtml}
                <span class="inbox__item-sender">${this._escape(item.sender || '')}</span>
                ${pillHtml}
              </div>
              ${turnLabel ? `<span class="inbox__item-turn">${this._escape(turnLabel)}</span>` : ''}
            </div>
            ${item.title ? `<div class="inbox__item-title">${this._escape(item.title)}</div>` : ''}
            ${previewHtml}
          </div>
        </div>
        ${detailHtml}
      </div>
    `;
  }

  _truncate(text, maxLen) {
    text = String(text || '');
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen).trim() + '…';
  }

  // ───────────────── targeted re-renders ─────────────────

  _renderHeader() {
    if (!this.rootEl) return;
    const oldHeader = this.rootEl.querySelector('[data-inbox-header]');
    if (!oldHeader) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = this._buildHeaderHtml().trim();
    if (tmp.firstElementChild) oldHeader.replaceWith(tmp.firstElementChild);
  }

  _renderFilters() {
    if (!this.rootEl) return;
    const oldFilters = this.rootEl.querySelector('[data-inbox-filters]');
    if (!oldFilters) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = this._buildFiltersHtml().trim();
    if (tmp.firstElementChild) oldFilters.replaceWith(tmp.firstElementChild);
  }

  _renderItems() {
    if (!this.rootEl) return;
    const list = this.rootEl.querySelector('[data-inbox-list]');
    if (list) list.innerHTML = this._buildItemsHtml();
  }

  // ───────────────── interaction handlers ─────────────────

  _setFilter(filter) {
    if (this._activeFilter === filter) return;
    this._activeFilter = filter;
    this._renderFilters();
    this._renderItems();
  }

  _toggleExpand(id) {
    const item = this._findItem(id);
    if (!item) return;

    const wasExpanded = this._expandedId === id;
    this._expandedId = wasExpanded ? null : id;

    let headerNeedsUpdate = false;
    if (!wasExpanded && this.options.autoMarkRead && !item.read) {
      item.read = true;
      headerNeedsUpdate = true;
      if (typeof this.options.onItemRead === 'function') {
        this.options.onItemRead(id);
      }
    }

    if (headerNeedsUpdate) this._renderHeader();
    this._renderItems();

    // Bring the expanded item into view if it ended up partially below the fold.
    if (this._expandedId === id && this.rootEl) {
      requestAnimationFrame(() => {
        if (!this.rootEl) return;
        const el = this.rootEl.querySelector(`[data-inbox-item="${this._cssEscape(id)}"]`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  }

  _handleAccept(id) {
    if (typeof this.options.onAccept === 'function') this.options.onAccept(id);
  }

  _handleDecline(id) {
    if (typeof this.options.onDecline === 'function') this.options.onDecline(id);
  }

  _handleDelegatedClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const closeBtn = target.closest('[data-inbox-action="close"]');
    if (closeBtn) { this.close(); return; }

    const filterBtn = target.closest('[data-inbox-filter]');
    if (filterBtn) { this._setFilter(filterBtn.getAttribute('data-inbox-filter')); return; }

    const acceptBtn = target.closest('[data-inbox-accept]');
    if (acceptBtn) { this._handleAccept(acceptBtn.getAttribute('data-inbox-accept')); return; }

    const declineBtn = target.closest('[data-inbox-decline]');
    if (declineBtn) { this._handleDecline(declineBtn.getAttribute('data-inbox-decline')); return; }

    const toggle = target.closest('[data-inbox-toggle]');
    if (toggle) { this._toggleExpand(toggle.getAttribute('data-inbox-toggle')); return; }
  }
}

if (typeof window !== 'undefined') {
  window.InboxPanel = InboxPanel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InboxPanel;
}
