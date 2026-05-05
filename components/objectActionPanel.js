/**
 * ObjectActionPanel — a self-contained anchored popover for selected board objects.
 *
 * No dependencies. Vanilla JS + injected stylesheet. Themeable via CSS variables.
 *
 * Two-part UI: a vertical action bar adjacent to the selected object plus a
 * contextual secondary panel that opens when the user clicks an action button.
 *
 * Content modes (built in):
 *   - 'speaker'        — auto-renders 'select' or 'appointed' based on options.appointedSpeaker
 *   - 'requests'       — vendor / sponsor proposals scoped to this object
 *   - 'upgrade'        — current tier + upgrade options
 *   - 'replace'        — list of objects this one can be swapped for
 *   - 'delete'         — confirmation with optional refund / warning
 *
 * Positioning:
 *   The popover anchors to the selected board object. Default placement is to
 *   the right of the anchor; if it overflows the viewport on the right, it
 *   flips to the left. Vertical position clamps to the viewport.
 *   Window resize / scroll triggers a debounced reposition automatically.
 *
 * USAGE
 * -----
 *   const menu = new ObjectActionPanel({
 *     anchorTo: stageEl,                           // element OR {left,top,right,bottom}
 *     object: { id: 'stage-1', name: 'Stage #1', type: 'stage' },
 *
 *     // Optional — derived from object.type if omitted
 *     actions: [
 *       { id: 'delete',  label: 'Delete',  icon: 'trash' },
 *       { id: 'upgrade', label: 'Upgrade', icon: 'upgrade' },
 *       { id: 'replace', label: 'Replace', icon: 'replace' },
 *       { id: 'speaker', label: 'Speaker', icon: 'mic' },
 *     ],
 *
 *     // Mode-specific data — pass whatever's relevant for this object
 *     speakers: [
 *       { id: 'sp1', name: 'Marko Petrović', topic: 'Local history',
 *         initials: 'MP', color: 'green', appeal: ['Seniors','Families'], fee: 80 },
 *     ],
 *     appointedSpeaker: null,           // when set, 'speaker' mode shows the appointed view
 *
 *     requests: [
 *       { id: 'r1', sender: 'Local brewery', title: 'Sponsor deal — €400/turn',
 *         body: 'Logo placement on the booth for 5 turns.',
 *         expiresInTurns: 2,
 *         terms: [ { label: 'Income', value: '€400/turn' } ] },
 *     ],
 *
 *     currentTier: { name: 'Standard Stage', stats: [ { label: 'Capacity', value: '200' } ] },
 *     upgradeOptions: [
 *       { id: 'u1', name: 'Premium Stage', cost: 800,
 *         stats: [ { label: 'Capacity', value: '300' } ],
 *         benefits: ['Better lighting', '+50% reach'] },
 *     ],
 *
 *     replaceOptions: [
 *       { id: 're1', name: 'Bar', costDelta: -200, description: 'Refund difference' },
 *       { id: 're2', name: 'Booth', costDelta: 100, description: 'Pays out per turn' },
 *     ],
 *
 *     deleteConfig: { refund: 240, warning: null },
 *
 *     onAction:          (id) => {},
 *     onDelete:          (objectId) => {},
 *     onUpgrade:         (upgradeId, objectId) => {},
 *     onReplace:         (replaceId, objectId) => {},
 *     onAppointSpeaker:  (speakerId, objectId) => {},
 *     onDismissSpeaker:  (objectId) => {},
 *     onAcceptRequest:   (requestId, objectId) => {},
 *     onDeclineRequest:  (requestId, objectId) => {},
 *     onClose:           () => {},
 *   });
 *
 *   menu.show();
 *   // later:
 *   menu.setMode('upgrade');                    // programmatically open a mode
 *   menu.setAppointedSpeaker(speakerObj);       // flip speaker mode to appointed view
 *   menu.update({ speakers: [...] });           // full re-render with new options
 *   menu.reposition();                          // call after the host repaints the board
 *   menu.close();
 *
 * THEMING
 * -------
 *   Override any of these CSS variables on :root or .oap-root to fit your tokens:
 *     --oap-bg, --oap-surface, --oap-border,
 *     --oap-text, --oap-text-secondary, --oap-text-tertiary,
 *     --oap-accent-bg, --oap-accent-text, --oap-accent-strong, --oap-accent-strong-hover,
 *     --oap-amber-bg, --oap-amber-text,
 *     --oap-danger-bg, --oap-danger-text, --oap-danger-strong, --oap-danger-strong-hover,
 *     --oap-radius-sm, --oap-radius-md, --oap-radius-lg,
 *     --oap-z-index, --oap-font-family
 */

const OBJECT_ACTION_PANEL_STYLES = `
.oap-root {
  position: fixed;
  z-index: var(--oap-z-index, 9998);
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-family: var(--oap-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif);
  opacity: 0;
  transition: opacity 120ms ease;
  box-sizing: border-box;
}
.oap-root *,
.oap-root *::before,
.oap-root *::after {
  box-sizing: border-box;
}
.oap-root--visible {
  opacity: 1;
}
.oap-root--flipped {
  flex-direction: row-reverse;
}

/* ─── Vertical action bar ─── */
.oap-bar {
  background: var(--oap-bg, #ffffff);
  border: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--oap-radius-lg, 12px);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}
.oap-bar__btn {
  width: 56px;
  height: 56px;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: transparent;
  border: none;
  border-radius: var(--oap-radius-md, 8px);
  cursor: pointer;
  color: var(--oap-text-secondary, #6b6b6b);
  font-family: inherit;
  transition: background 100ms ease, color 100ms ease;
}
.oap-bar__btn:hover {
  background: var(--oap-surface, #f5f5f5);
  color: var(--oap-text, #1a1a1a);
}
.oap-bar__btn--active,
.oap-bar__btn--active:hover {
  background: var(--oap-accent-bg, #EAF3DE);
  color: var(--oap-accent-text, #27500A);
}
.oap-bar__btn--danger:hover {
  background: var(--oap-danger-bg, #FAE3E3);
  color: var(--oap-danger-text, #8B2929);
}
.oap-bar__btn--danger.oap-bar__btn--active,
.oap-bar__btn--danger.oap-bar__btn--active:hover {
  background: var(--oap-danger-bg, #FAE3E3);
  color: var(--oap-danger-text, #8B2929);
}
.oap-bar__btn svg {
  width: 16px;
  height: 16px;
}
.oap-bar__label {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.1px;
}

/* ─── Secondary panel ─── */
.oap-panel {
  width: 320px;
  max-width: calc(100vw - 32px);
  background: var(--oap-bg, #ffffff);
  border: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--oap-radius-lg, 12px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
}
.oap-panel--delete {
  width: 280px;
}
.oap-panel__header {
  padding: 14px 18px 12px;
  border-bottom: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}
.oap-panel__eyebrow {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--oap-text-tertiary, #9a9a9a);
  line-height: 1.3;
}
.oap-panel__title {
  margin: 1px 0 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--oap-text, #1a1a1a);
}
.oap-panel__close {
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--oap-radius-sm, 6px);
  color: var(--oap-text-secondary, #6b6b6b);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 100ms ease, border-color 100ms ease;
}
.oap-panel__close:hover {
  background: var(--oap-surface, #f5f5f5);
  border-color: var(--oap-text-tertiary, #9a9a9a);
}
.oap-panel__body {
  overflow-y: auto;
  min-height: 0;
}
.oap-panel__empty {
  padding: 32px 18px;
  text-align: center;
  font-size: 13px;
  color: var(--oap-text-tertiary, #9a9a9a);
}

/* ─── Section labels (used by upgrade mode) ─── */
.oap-section-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--oap-text-tertiary, #9a9a9a);
  padding: 12px 18px 6px;
}
.oap-section-label:first-child {
  padding-top: 14px;
}

/* ─── Avatar ─── */
.oap-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}
.oap-avatar--lg {
  width: 40px;
  height: 40px;
  font-size: 13px;
}
.oap-avatar--green { background: #EAF3DE; color: #27500A; }
.oap-avatar--blue  { background: #DEE9F3; color: #1B4982; }
.oap-avatar--amber { background: #FAEEDA; color: #854F0B; }
.oap-avatar--rose  { background: #F8E1E1; color: #8B2929; }
.oap-avatar--gray  { background: #F1EFE8; color: #5F5E5A; }
.oap-avatar--purple { background: #E9E2F0; color: #4B2A75; }

/* ─── Pills ─── */
.oap-pill {
  display: inline-block;
  font-size: 9.5px;
  padding: 2px 7px;
  background: var(--oap-surface, #f5f5f5);
  color: var(--oap-text-secondary, #6b6b6b);
  border-radius: 999px;
  white-space: nowrap;
}
.oap-pill--proposal {
  font-weight: 500;
  background: var(--oap-amber-bg, #FAEEDA);
  color: var(--oap-amber-text, #854F0B);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 9.5px;
}

/* ─── Speaker (select + appointed) ─── */
.oap-speaker {
  padding: 12px 18px;
  border-bottom: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.oap-speaker:last-child {
  border-bottom: none;
}
.oap-speaker--appointed {
  padding: 16px 18px 14px;
  background: var(--oap-surface, #f5f5f5);
  border-bottom: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
}
.oap-speaker__info {
  flex: 1;
  min-width: 0;
}
.oap-speaker__name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--oap-text, #1a1a1a);
}
.oap-speaker__topic {
  font-size: 11.5px;
  color: var(--oap-text-secondary, #6b6b6b);
  margin-top: 1px;
}
.oap-speaker__appeal {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.oap-speaker__since {
  font-size: 11px;
  color: var(--oap-text-tertiary, #9a9a9a);
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
}
.oap-speaker__action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.oap-speaker__fee {
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--oap-text, #1a1a1a);
}

/* ─── Requests ─── */
.oap-request {
  padding: 14px 18px;
  border-bottom: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
}
.oap-request:last-child {
  border-bottom: none;
}
.oap-request__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.oap-request__sender {
  font-size: 11.5px;
  color: var(--oap-text-secondary, #6b6b6b);
}
.oap-request__title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--oap-text, #1a1a1a);
}
.oap-request__body {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--oap-text-secondary, #6b6b6b);
  line-height: 1.5;
}
.oap-request__warning {
  display: inline-block;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--oap-amber-text, #854F0B);
  background: var(--oap-amber-bg, #FAEEDA);
  padding: 3px 8px;
  border-radius: var(--oap-radius-md, 8px);
}
.oap-request__warning--muted {
  background: transparent;
  color: var(--oap-text-tertiary, #9a9a9a);
  padding: 0;
  font-weight: 400;
}

/* ─── Term grid (shared by requests + tier stats) ─── */
.oap-terms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 6px;
  margin-bottom: 10px;
}
.oap-term {
  padding: 8px 10px;
  background: var(--oap-surface, #f5f5f5);
  border-radius: var(--oap-radius-md, 8px);
}
.oap-term__label {
  font-size: 10px;
  color: var(--oap-text-tertiary, #9a9a9a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}
.oap-term__value {
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--oap-text, #1a1a1a);
}

/* ─── Upgrade tiers ─── */
.oap-tier {
  margin: 0 18px 12px;
  padding: 12px 14px;
  border: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--oap-radius-md, 8px);
}
.oap-tier--current {
  background: var(--oap-surface, #f5f5f5);
  border-color: transparent;
}
.oap-tier__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}
.oap-tier__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--oap-text, #1a1a1a);
}
.oap-tier__cost {
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--oap-text, #1a1a1a);
}
.oap-tier__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 6px;
  margin-bottom: 8px;
}
.oap-tier__stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.oap-tier__stat-label {
  font-size: 10px;
  color: var(--oap-text-tertiary, #9a9a9a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.oap-tier__stat-value {
  font-size: 12.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--oap-text, #1a1a1a);
}
.oap-tier__benefits {
  list-style: none;
  margin: 8px 0;
  padding: 0;
  font-size: 11.5px;
  color: var(--oap-text-secondary, #6b6b6b);
}
.oap-tier__benefit {
  position: relative;
  padding-left: 14px;
  margin-bottom: 3px;
  line-height: 1.4;
}
.oap-tier__benefit::before {
  content: "+";
  position: absolute;
  left: 0;
  color: var(--oap-accent-strong, #3B6D11);
  font-weight: 600;
}

/* ─── Replace items ─── */
.oap-replace-item {
  padding: 12px 18px;
  border-bottom: 0.5px solid var(--oap-border, rgba(0, 0, 0, 0.1));
  display: flex;
  gap: 12px;
  align-items: center;
}
.oap-replace-item:last-child {
  border-bottom: none;
}
.oap-replace-item__info {
  flex: 1;
  min-width: 0;
}
.oap-replace-item__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--oap-text, #1a1a1a);
}
.oap-replace-item__desc {
  font-size: 11.5px;
  color: var(--oap-text-secondary, #6b6b6b);
  margin-top: 1px;
}
.oap-replace-item__action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.oap-replace-item__delta {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--oap-text-secondary, #6b6b6b);
}
.oap-replace-item__delta--cost {
  color: var(--oap-text, #1a1a1a);
  font-weight: 500;
}
.oap-replace-item__delta--refund {
  color: var(--oap-accent-strong, #3B6D11);
  font-weight: 500;
}

/* ─── Delete confirm ─── */
.oap-delete {
  padding: 16px 18px;
}
.oap-delete__title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--oap-text, #1a1a1a);
  line-height: 1.4;
}
.oap-delete__detail {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--oap-text-secondary, #6b6b6b);
  line-height: 1.5;
}
.oap-delete__strong {
  color: var(--oap-text, #1a1a1a);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.oap-delete__warning {
  margin: 8px 0 0;
  font-size: 11.5px;
  color: var(--oap-danger-text, #8B2929);
  background: var(--oap-danger-bg, #FAE3E3);
  padding: 6px 10px;
  border-radius: var(--oap-radius-md, 8px);
  line-height: 1.4;
}

/* ─── Action rows ─── */
.oap-actions-row {
  display: flex;
  gap: 8px;
  padding: 12px 18px 14px;
  flex-wrap: wrap;
}
.oap-actions-row--inline {
  padding: 0;
  margin-top: 10px;
}

/* ─── Buttons ─── */
.oap-btn {
  font-size: 12px;
  font-weight: 500;
  padding: 7px 14px;
  border: 0.5px solid transparent;
  border-radius: var(--oap-radius-md, 8px);
  cursor: pointer;
  font-family: inherit;
  transition: background 100ms ease, border-color 100ms ease, color 100ms ease, transform 80ms ease;
  white-space: nowrap;
}
.oap-btn:active {
  transform: scale(0.97);
}
.oap-btn--block {
  display: block;
  width: 100%;
}
.oap-btn--primary {
  background: var(--oap-accent-strong, #3B6D11);
  color: var(--oap-accent-strong-text, #ffffff);
  border-color: var(--oap-accent-strong, #3B6D11);
}
.oap-btn--primary:hover {
  background: var(--oap-accent-strong-hover, #27500A);
  border-color: var(--oap-accent-strong-hover, #27500A);
}
.oap-btn--secondary {
  background: transparent;
  color: var(--oap-text-secondary, #6b6b6b);
  border-color: var(--oap-border, rgba(0, 0, 0, 0.1));
}
.oap-btn--secondary:hover {
  background: var(--oap-surface, #f5f5f5);
  border-color: var(--oap-text-tertiary, #9a9a9a);
  color: var(--oap-text, #1a1a1a);
}
.oap-btn--danger {
  background: var(--oap-danger-strong, #B43838);
  color: #ffffff;
  border-color: var(--oap-danger-strong, #B43838);
}
.oap-btn--danger:hover {
  background: var(--oap-danger-strong-hover, #8B2929);
  border-color: var(--oap-danger-strong-hover, #8B2929);
}
.oap-btn--small {
  padding: 5px 12px;
  font-size: 11px;
}

.oap-bar__btn:focus-visible,
.oap-panel__close:focus-visible,
.oap-btn:focus-visible {
  outline: 2px solid var(--oap-accent-strong, #3B6D11);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .oap-root,
  .oap-bar__btn,
  .oap-btn,
  .oap-panel__close {
    transition: none;
  }
}
`;

// SVG icons. Looked up by `icon` field on action; falls back to action `id`.
const OAP_ICONS = {
  trash:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  delete:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  upgrade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 3 18 9"/><line x1="12" y1="3" x2="12" y2="15"/><line x1="5" y1="20" x2="19" y2="20"/></svg>',
  replace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  mic:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  inbox:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>',
  requests:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>',
  close:   '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

// Default action sets per object.type. Host can override entirely via `actions`.
const OAP_DEFAULT_ACTIONS_BY_TYPE = {
  stage:      [
    { id: 'delete',  label: 'Delete',  icon: 'trash',   danger: true },
    { id: 'upgrade', label: 'Upgrade', icon: 'upgrade' },
    { id: 'replace', label: 'Replace', icon: 'replace' },
    { id: 'speaker', label: 'Speaker', icon: 'mic' },
  ],
  booth:      [
    { id: 'delete',   label: 'Delete',   icon: 'trash',   danger: true },
    { id: 'upgrade',  label: 'Upgrade',  icon: 'upgrade' },
    { id: 'replace',  label: 'Replace',  icon: 'replace' },
    { id: 'requests', label: 'Requests', icon: 'inbox'   },
  ],
  bar:        [
    { id: 'delete',   label: 'Delete',   icon: 'trash',   danger: true },
    { id: 'upgrade',  label: 'Upgrade',  icon: 'upgrade' },
    { id: 'replace',  label: 'Replace',  icon: 'replace' },
    { id: 'requests', label: 'Requests', icon: 'inbox'   },
  ],
  bench:      [
    { id: 'delete',  label: 'Delete',  icon: 'trash',   danger: true },
    { id: 'replace', label: 'Replace', icon: 'replace' },
  ],
  decoration: [
    { id: 'delete',  label: 'Delete',  icon: 'trash',   danger: true },
    { id: 'replace', label: 'Replace', icon: 'replace' },
  ],
  default:    [
    { id: 'delete',  label: 'Delete',  icon: 'trash',   danger: true },
    { id: 'replace', label: 'Replace', icon: 'replace' },
  ],
};

class ObjectActionPanel {
  constructor(options = {}) {
    this.options = Object.assign({
      anchorTo:        null,
      placement:       'auto',         // 'auto' | 'right' | 'left'
      object:          { id: '', name: '', type: '' },
      actions:         null,            // null = derive from object.type

      speakers:        [],
      appointedSpeaker: null,

      requests:        [],

      currentTier:     null,
      upgradeOptions:  [],

      replaceOptions:  [],

      deleteConfig:    { refund: 0, warning: null },

      currency:        '€',
      dismissible:     true,            // ESC + outside click

      onAction:           null,
      onDelete:           null,
      onUpgrade:          null,
      onReplace:          null,
      onAppointSpeaker:   null,
      onDismissSpeaker:   null,
      onAcceptRequest:    null,
      onDeclineRequest:   null,
      onClose:            null,
    }, options);

    this._mode = null;
    this._rootEl = null;
    this._previouslyFocused = null;
    this._scheduledReposition = null;

    this._handleKeyDown        = this._handleKeyDown.bind(this);
    this._handleOutsideClick   = this._handleOutsideClick.bind(this);
    this._handleViewportChange = this._handleViewportChange.bind(this);
  }

  static ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('oap-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'oap-styles';
    styleEl.textContent = OBJECT_ACTION_PANEL_STYLES;
    document.head.appendChild(styleEl);
  }

  // ───────── lifecycle ─────────

  show() {
    if (this._rootEl) return this;
    ObjectActionPanel.ensureStyles();
    this._previouslyFocused = document.activeElement;

    this._rootEl = document.createElement('div');
    this._rootEl.className = 'oap-root';
    this._rootEl.setAttribute('role', 'dialog');
    this._rootEl.setAttribute('aria-label', this.options.object?.name || 'Object actions');
    this._rootEl.innerHTML = this._buildInnerHtml();
    document.body.appendChild(this._rootEl);
    this._attachHandlers();

    this._reposition();

    requestAnimationFrame(() => {
      if (this._rootEl) this._rootEl.classList.add('oap-root--visible');
      const firstBtn = this._rootEl?.querySelector('.oap-bar__btn');
      if (firstBtn) firstBtn.focus();
    });

    document.addEventListener('keydown', this._handleKeyDown);
    // Defer outside-click listener so the click that opened the menu doesn't immediately close it.
    setTimeout(() => {
      document.addEventListener('mousedown', this._handleOutsideClick);
    }, 0);
    window.addEventListener('resize', this._handleViewportChange);
    window.addEventListener('scroll', this._handleViewportChange, true);

    return this;
  }

  close() {
    if (!this._rootEl) return;
    document.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('mousedown', this._handleOutsideClick);
    window.removeEventListener('resize', this._handleViewportChange);
    window.removeEventListener('scroll', this._handleViewportChange, true);

    const el = this._rootEl;
    el.classList.remove('oap-root--visible');
    this._rootEl = null;
    this._mode = null;

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

  // ───────── public API ─────────

  /** Open or toggle a content mode in the secondary panel. */
  setMode(modeId) {
    const newMode = this._mode === modeId ? null : modeId;
    this._mode = newMode;
    this._rerender();
  }

  /** Close just the secondary panel; keep the bar visible. */
  closePanelOnly() {
    if (this._mode === null) return;
    this._mode = null;
    this._rerender();
  }

  /** Currently open mode id, or null. */
  getMode() {
    return this._mode;
  }

  /** Convenience: flip 'speaker' mode between select + appointed views. */
  setAppointedSpeaker(speaker) {
    this.options.appointedSpeaker = speaker || null;
    if (this._rootEl && this._mode === 'speaker') {
      this._rerender();
    }
  }

  /** Full re-render with new options merged in. */
  update(newOptions) {
    Object.assign(this.options, newOptions);
    if (this._rootEl) this._rerender();
  }

  /** Recompute position. Call after the host repaints the board. */
  reposition() {
    this._reposition();
  }

  // ───────── internal: rendering ─────────

  _rerender() {
    if (!this._rootEl) return;
    this._rootEl.innerHTML = this._buildInnerHtml();
    this._attachHandlers();
    this._reposition();
  }

  _buildInnerHtml() {
    return this._buildBarHtml() + this._buildPanelHtml();
  }

  _getActions() {
    if (Array.isArray(this.options.actions)) return this.options.actions;
    const type = this.options.object?.type;
    return OAP_DEFAULT_ACTIONS_BY_TYPE[type] || OAP_DEFAULT_ACTIONS_BY_TYPE.default;
  }

  _buildBarHtml() {
    const actions = this._getActions();
    const buttons = actions.map(action => {
      const isActive = this._actionMode(action) === this._mode && this._mode !== null;
      const classes = ['oap-bar__btn'];
      if (isActive) classes.push('oap-bar__btn--active');
      if (action.danger) classes.push('oap-bar__btn--danger');
      const iconHtml = OAP_ICONS[action.icon] || OAP_ICONS[action.id] || '';
      return `
        <button
          class="${classes.join(' ')}"
          type="button"
          data-oap-action="${this._escape(action.id)}"
          aria-pressed="${isActive ? 'true' : 'false'}"
          title="${this._escape(action.label || action.id)}"
        >
          ${iconHtml}
          <span class="oap-bar__label">${this._escape(action.label || action.id)}</span>
        </button>
      `;
    }).join('');
    return `<div class="oap-bar">${buttons}</div>`;
  }

  _actionMode(action) {
    return action.mode !== undefined ? action.mode : action.id;
  }

  _buildPanelHtml() {
    if (this._mode === null) return '';

    const titles = {
      speaker:  this.options.appointedSpeaker ? 'Current speaker' : 'Appoint speaker',
      requests: 'Vendor requests',
      upgrade:  'Upgrade',
      replace:  'Replace with',
      delete:   'Delete object',
    };
    const title = titles[this._mode] || this._mode;

    const panelClasses = ['oap-panel', `oap-panel--${this._mode}`];

    return `
      <div class="${panelClasses.join(' ')}">
        <div class="oap-panel__header">
          <div>
            <div class="oap-panel__eyebrow">${this._escape(this.options.object?.name || '')}</div>
            <h3 class="oap-panel__title">${this._escape(title)}</h3>
          </div>
          <button type="button" class="oap-panel__close" aria-label="Close panel" data-oap-close-panel>
            ${OAP_ICONS.close}
          </button>
        </div>
        <div class="oap-panel__body">${this._buildModeContent()}</div>
      </div>
    `;
  }

  _buildModeContent() {
    switch (this._mode) {
      case 'speaker':
        return this.options.appointedSpeaker
          ? this._buildSpeakerAppointedHtml()
          : this._buildSpeakerSelectHtml();
      case 'requests': return this._buildRequestsHtml();
      case 'upgrade':  return this._buildUpgradeHtml();
      case 'replace':  return this._buildReplaceHtml();
      case 'delete':   return this._buildDeleteConfirmHtml();
      default:         return '';
    }
  }

  // ───────── mode: speaker (select) ─────────

  _buildSpeakerSelectHtml() {
    const speakers = this.options.speakers || [];
    if (speakers.length === 0) {
      return `<div class="oap-panel__empty">No speakers available.</div>`;
    }
    return speakers.map(sp => this._buildSpeakerCardHtml(sp, 'select')).join('');
  }

  _buildSpeakerCardHtml(speaker, variant) {
    const initials = speaker.initials || this._initialsFrom(speaker.name);
    const colorClass = `oap-avatar--${speaker.color || 'green'}`;
    const appealHtml = (speaker.appeal || []).map(a =>
      `<span class="oap-pill">${this._escape(a)}</span>`
    ).join('');
    const fee = `${this._formatMoney(speaker.fee)}/turn`;

    if (variant === 'appointed') {
      const since = speaker.appointedTurn != null
        ? `Appointed since turn ${Math.round(speaker.appointedTurn)} · ${fee}`
        : `Fee ${fee}`;
      return `
        <div class="oap-speaker oap-speaker--appointed">
          <div class="oap-avatar oap-avatar--lg ${colorClass}">${this._escape(initials)}</div>
          <div class="oap-speaker__info">
            <div class="oap-speaker__name">${this._escape(speaker.name)}</div>
            <div class="oap-speaker__topic">${this._escape(speaker.topic || '')}</div>
            ${appealHtml ? `<div class="oap-speaker__appeal">${appealHtml}</div>` : ''}
            <div class="oap-speaker__since">${this._escape(since)}</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="oap-speaker">
        <div class="oap-avatar ${colorClass}">${this._escape(initials)}</div>
        <div class="oap-speaker__info">
          <div class="oap-speaker__name">${this._escape(speaker.name)}</div>
          <div class="oap-speaker__topic">${this._escape(speaker.topic || '')}</div>
          ${appealHtml ? `<div class="oap-speaker__appeal">${appealHtml}</div>` : ''}
        </div>
        <div class="oap-speaker__action">
          <span class="oap-speaker__fee">${this._escape(fee)}</span>
          <button
            type="button"
            class="oap-btn oap-btn--primary oap-btn--small"
            data-oap-appoint="${this._escape(speaker.id)}"
          >Appoint</button>
        </div>
      </div>
    `;
  }

  // ───────── mode: speaker (appointed) ─────────

  _buildSpeakerAppointedHtml() {
    const sp = this.options.appointedSpeaker;
    return `
      ${this._buildSpeakerCardHtml(sp, 'appointed')}
      <div class="oap-actions-row">
        <button type="button" class="oap-btn oap-btn--primary"   data-oap-replace-speaker>Replace</button>
        <button type="button" class="oap-btn oap-btn--secondary" data-oap-dismiss-speaker>Dismiss</button>
      </div>
    `;
  }

  // ───────── mode: requests ─────────

  _buildRequestsHtml() {
    const reqs = this.options.requests || [];
    if (reqs.length === 0) {
      return `<div class="oap-panel__empty">No active requests.</div>`;
    }
    return reqs.map(r => this._buildRequestHtml(r)).join('');
  }

  _buildRequestHtml(r) {
    const termsHtml = (r.terms || []).map(t => `
      <div class="oap-term">
        <div class="oap-term__label">${this._escape(t.label)}</div>
        <div class="oap-term__value">${this._escape(t.value)}</div>
      </div>
    `).join('');

    let warningHtml = '';
    if (r.expiresInTurns != null) {
      const t = Math.round(Number(r.expiresInTurns));
      let text;
      let urgent = true;
      if (t <= 0)        { text = 'Expires this turn'; }
      else if (t === 1)  { text = 'Expires next turn'; }
      else               { text = `Expires in ${t} turns`; urgent = false; }
      const cls = `oap-request__warning${urgent ? '' : ' oap-request__warning--muted'}`;
      warningHtml = `<div class="${cls}">${this._escape(text)}</div>`;
    }

    return `
      <div class="oap-request">
        <div class="oap-request__head">
          <span class="oap-request__sender">${this._escape(r.sender || '')}</span>
          <span class="oap-pill oap-pill--proposal">Proposal</span>
        </div>
        <div class="oap-request__title">${this._escape(r.title || '')}</div>
        ${r.body ? `<p class="oap-request__body">${this._escape(r.body)}</p>` : ''}
        ${warningHtml}
        ${termsHtml ? `<div class="oap-terms">${termsHtml}</div>` : ''}
        <div class="oap-actions-row oap-actions-row--inline">
          <button type="button" class="oap-btn oap-btn--primary"   data-oap-accept-request="${this._escape(r.id)}">Accept</button>
          <button type="button" class="oap-btn oap-btn--secondary" data-oap-decline-request="${this._escape(r.id)}">Decline</button>
        </div>
      </div>
    `;
  }

  // ───────── mode: upgrade ─────────

  _buildUpgradeHtml() {
    const current = this.options.currentTier;
    const opts = this.options.upgradeOptions || [];

    let html = '';

    if (current) {
      html += `<div class="oap-section-label">Current</div>`;
      html += this._buildTierHtml(current, /* isCurrent */ true);
    }

    if (opts.length > 0) {
      html += `<div class="oap-section-label">Available</div>`;
      html += opts.map(opt => this._buildTierHtml(opt, /* isCurrent */ false)).join('');
    } else if (current) {
      html += `<div class="oap-panel__empty">Already at max tier.</div>`;
    } else {
      html += `<div class="oap-panel__empty">No upgrades available.</div>`;
    }

    return html;
  }

  _buildTierHtml(tier, isCurrent) {
    const statsHtml = (tier.stats || []).map(s => `
      <div class="oap-tier__stat">
        <span class="oap-tier__stat-label">${this._escape(s.label)}</span>
        <span class="oap-tier__stat-value">${this._escape(s.value)}</span>
      </div>
    `).join('');

    const benefitsHtml = (tier.benefits || []).map(b => `
      <li class="oap-tier__benefit">${this._escape(b)}</li>
    `).join('');

    const costHtml = (!isCurrent && tier.cost != null)
      ? `<div class="oap-tier__cost">${this._formatMoney(tier.cost)}</div>`
      : '';

    const buttonHtml = (!isCurrent)
      ? `<button
           type="button"
           class="oap-btn oap-btn--primary oap-btn--block"
           data-oap-upgrade="${this._escape(tier.id || '')}"
         >${tier.cost != null ? `Upgrade for ${this._formatMoney(tier.cost)}` : 'Upgrade'}</button>`
      : '';

    return `
      <div class="oap-tier${isCurrent ? ' oap-tier--current' : ''}">
        <div class="oap-tier__head">
          <div class="oap-tier__name">${this._escape(tier.name || '')}</div>
          ${costHtml}
        </div>
        ${statsHtml ? `<div class="oap-tier__stats">${statsHtml}</div>` : ''}
        ${benefitsHtml ? `<ul class="oap-tier__benefits">${benefitsHtml}</ul>` : ''}
        ${buttonHtml}
      </div>
    `;
  }

  // ───────── mode: replace ─────────

  _buildReplaceHtml() {
    const opts = this.options.replaceOptions || [];
    if (opts.length === 0) {
      return `<div class="oap-panel__empty">No replacement options.</div>`;
    }
    return opts.map(opt => this._buildReplaceItemHtml(opt)).join('');
  }

  _buildReplaceItemHtml(opt) {
    const delta = Number(opt.costDelta) || 0;
    let deltaText = 'No cost';
    let deltaClass = '';
    if (delta > 0) {
      deltaText = `Pay ${this._formatMoney(delta)}`;
      deltaClass = ' oap-replace-item__delta--cost';
    } else if (delta < 0) {
      deltaText = `Refund ${this._formatMoney(Math.abs(delta))}`;
      deltaClass = ' oap-replace-item__delta--refund';
    }

    return `
      <div class="oap-replace-item">
        <div class="oap-replace-item__info">
          <div class="oap-replace-item__name">${this._escape(opt.name || '')}</div>
          ${opt.description ? `<div class="oap-replace-item__desc">${this._escape(opt.description)}</div>` : ''}
        </div>
        <div class="oap-replace-item__action">
          <span class="oap-replace-item__delta${deltaClass}">${this._escape(deltaText)}</span>
          <button
            type="button"
            class="oap-btn oap-btn--primary oap-btn--small"
            data-oap-replace="${this._escape(opt.id || '')}"
          >Swap</button>
        </div>
      </div>
    `;
  }

  // ───────── mode: delete-confirm ─────────

  _buildDeleteConfirmHtml() {
    const cfg = this.options.deleteConfig || {};
    const refundHtml = cfg.refund
      ? `<p class="oap-delete__detail">You'll be refunded <span class="oap-delete__strong">${this._formatMoney(cfg.refund)}</span>.</p>`
      : '';
    const warningHtml = cfg.warning
      ? `<p class="oap-delete__warning">${this._escape(cfg.warning)}</p>`
      : '';

    return `
      <div class="oap-delete">
        <p class="oap-delete__title">Delete ${this._escape(this.options.object?.name || 'this object')}?</p>
        ${refundHtml}
        ${warningHtml}
        <div class="oap-actions-row oap-actions-row--inline">
          <button type="button" class="oap-btn oap-btn--secondary" data-oap-cancel-delete>Cancel</button>
          <button type="button" class="oap-btn oap-btn--danger"    data-oap-confirm-delete>Delete</button>
        </div>
      </div>
    `;
  }

  // ───────── handlers ─────────

  _attachHandlers() {
    if (!this._rootEl) return;
    this._rootEl.addEventListener('click', (e) => this._handleDelegatedClick(e));
  }

  _handleDelegatedClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const objectId = this.options.object?.id;
    const opts = this.options;

    // Bar action button → toggle/open mode
    const actionBtn = target.closest('[data-oap-action]');
    if (actionBtn) {
      const id = actionBtn.getAttribute('data-oap-action');
      if (typeof opts.onAction === 'function') opts.onAction(id);
      const action = this._getActions().find(a => a.id === id);
      const mode = action ? this._actionMode(action) : id;
      if (mode === null || mode === false) return; // fire-only
      this.setMode(mode);
      return;
    }

    // Panel close X
    if (target.closest('[data-oap-close-panel]')) {
      this.closePanelOnly();
      return;
    }

    // Speaker — appoint
    const appointBtn = target.closest('[data-oap-appoint]');
    if (appointBtn) {
      const speakerId = appointBtn.getAttribute('data-oap-appoint');
      if (typeof opts.onAppointSpeaker === 'function') {
        opts.onAppointSpeaker(speakerId, objectId);
      }
      return;
    }

    // Speaker — replace (back to selection)
    if (target.closest('[data-oap-replace-speaker]')) {
      // Host may want to clear appointedSpeaker; we just flip the view temporarily.
      // The host can call setAppointedSpeaker(null) explicitly to make it durable.
      this.options.appointedSpeaker = null;
      this._rerender();
      return;
    }

    // Speaker — dismiss
    if (target.closest('[data-oap-dismiss-speaker]')) {
      if (typeof opts.onDismissSpeaker === 'function') {
        opts.onDismissSpeaker(objectId);
      }
      return;
    }

    // Requests
    const acceptReqBtn = target.closest('[data-oap-accept-request]');
    if (acceptReqBtn) {
      const id = acceptReqBtn.getAttribute('data-oap-accept-request');
      if (typeof opts.onAcceptRequest === 'function') {
        opts.onAcceptRequest(id, objectId);
      }
      return;
    }
    const declineReqBtn = target.closest('[data-oap-decline-request]');
    if (declineReqBtn) {
      const id = declineReqBtn.getAttribute('data-oap-decline-request');
      if (typeof opts.onDeclineRequest === 'function') {
        opts.onDeclineRequest(id, objectId);
      }
      return;
    }

    // Upgrade
    const upgradeBtn = target.closest('[data-oap-upgrade]');
    if (upgradeBtn) {
      const id = upgradeBtn.getAttribute('data-oap-upgrade');
      if (typeof opts.onUpgrade === 'function') {
        opts.onUpgrade(id, objectId);
      }
      return;
    }

    // Replace
    const replaceBtn = target.closest('[data-oap-replace]');
    if (replaceBtn) {
      const id = replaceBtn.getAttribute('data-oap-replace');
      if (typeof opts.onReplace === 'function') {
        opts.onReplace(id, objectId);
      }
      return;
    }

    // Delete confirm
    if (target.closest('[data-oap-confirm-delete]')) {
      if (typeof opts.onDelete === 'function') {
        opts.onDelete(objectId);
      }
      return;
    }
    if (target.closest('[data-oap-cancel-delete]')) {
      this.closePanelOnly();
      return;
    }
  }

  _handleKeyDown(e) {
    if (e.key !== 'Escape' || !this.options.dismissible) return;
    e.stopPropagation();
    if (this._mode !== null) {
      this.closePanelOnly();
    } else {
      this.close();
    }
  }

  _handleOutsideClick(e) {
    if (!this._rootEl || !this.options.dismissible) return;
    if (this._rootEl.contains(e.target)) return;
    // If host gave us a DOM anchor, ignore clicks on it (the same click that opened us).
    const anchor = this.options.anchorTo;
    if (anchor && anchor instanceof Element && anchor.contains(e.target)) return;
    this.close();
  }

  _handleViewportChange() {
    if (this._scheduledReposition) return;
    this._scheduledReposition = requestAnimationFrame(() => {
      this._scheduledReposition = null;
      this._reposition();
    });
  }

  // ───────── positioning ─────────

  _reposition() {
    if (!this._rootEl) return;
    const anchorRect = this._getAnchorRect();
    if (!anchorRect) return;

    // Reset side classes so measurement is on the natural layout, then measure.
    this._rootEl.classList.remove('oap-root--flipped');
    // Temporarily remove explicit position so getBoundingClientRect reflects intrinsic size.
    this._rootEl.style.left = '0px';
    this._rootEl.style.top = '0px';

    const rect = this._rootEl.getBoundingClientRect();
    const totalWidth  = rect.width;
    const totalHeight = rect.height;

    const gap = 8;
    const margin = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const placement = this.options.placement || 'auto';

    const fitsRight = anchorRect.right + gap + totalWidth + margin <= viewportW;
    const fitsLeft  = anchorRect.left  - gap - totalWidth - margin >= 0;

    let flipped;
    if (placement === 'left')       flipped = true;
    else if (placement === 'right') flipped = false;
    else                            flipped = !fitsRight && fitsLeft;

    let left;
    if (flipped) {
      left = anchorRect.left - gap - totalWidth;
      if (left < margin) left = margin;
    } else {
      left = anchorRect.right + gap;
      if (left + totalWidth > viewportW - margin) {
        left = Math.max(margin, viewportW - totalWidth - margin);
      }
    }

    let top = anchorRect.top;
    if (top + totalHeight > viewportH - margin) {
      top = viewportH - totalHeight - margin;
    }
    if (top < margin) top = margin;

    this._rootEl.classList.toggle('oap-root--flipped', flipped);
    this._rootEl.style.left = `${Math.round(left)}px`;
    this._rootEl.style.top  = `${Math.round(top)}px`;
  }

  _getAnchorRect() {
    const a = this.options.anchorTo;
    if (!a) return null;
    if (typeof Element !== 'undefined' && a instanceof Element) {
      return a.getBoundingClientRect();
    }
    if (typeof a === 'object') {
      // {left, top, right, bottom, width, height}
      if ('left' in a && 'top' in a) {
        const left   = Number(a.left)   || 0;
        const top    = Number(a.top)    || 0;
        const width  = a.width  != null ? Number(a.width)  : (Number(a.right)  || left) - left;
        const height = a.height != null ? Number(a.height) : (Number(a.bottom) || top)  - top;
        return { left, top, right: left + width, bottom: top + height, width, height };
      }
      // {x, y, width, height}
      if ('x' in a && 'y' in a) {
        const left   = Number(a.x) || 0;
        const top    = Number(a.y) || 0;
        const width  = Number(a.width)  || 0;
        const height = Number(a.height) || 0;
        return { left, top, right: left + width, bottom: top + height, width, height };
      }
    }
    return null;
  }

  // ───────── helpers ─────────

  _escape(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  _formatMoney(amount) {
    const n = Math.round(Number(amount) || 0);
    const sign = n < 0 ? '-' : '';
    return `${sign}${this.options.currency}${Math.abs(n).toLocaleString()}`;
  }

  _initialsFrom(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}

if (typeof window !== 'undefined') {
  window.ObjectActionPanel = ObjectActionPanel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ObjectActionPanel;
}
