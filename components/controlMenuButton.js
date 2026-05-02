const BUTTON_STYLE = `.gb-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: var(--gb-row-padding-y, 10px) var(--gb-row-padding-x, 12px);
  width: 100%;
  background: transparent;
  border: none;
  border-top: 0.5px solid var(--gb-border, rgba(15, 23, 42, .12));
  font-family: inherit;
  font-size: 14px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 100ms ease;
}
 
.gb-row:first-child {
  border-top: none;
}
 
.gb-row:hover,
.gb-row:focus-visible {
  background: var(--gb-bg-hover, rgba(15, 23, 42, .05));
  outline: none;
}
 
.gb-row:focus-visible {
  box-shadow: inset 0 0 0 2px var(--gb-text, #0f172a);
}
 
.gb-row--utility {
  background: var(--gb-bg-utility, rgba(15, 23, 42, .03));
}
 
.gb-row--utility:hover,
.gb-row--utility:focus-visible {
  background: var(--gb-bg-hover, rgba(15, 23, 42, .05));
}
 
.gb-row--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
 
.gb-row__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--gb-text-secondary, var(--gb-text-muted, #64748b));
}
 
.gb-row__icon svg {
  display: block;
}
 
.gb-row__label {
  flex: 1;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.3;
  color: var(--gb-text, #0f172a);
  /* truncate gracefully in narrow sidebars */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
 
.gb-row__value {
  font-size: 13px;
  color: var(--gb-text-secondary, var(--gb-text-muted, #64748b));
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
 
.gb-row--empty .gb-row__value {
  color: var(--gb-text-tertiary, var(--gb-text-subtle, #94a3b8));
}
 
.gb-row__chevron {
  flex-shrink: 0;
  color: var(--gb-text-tertiary, var(--gb-text-subtle, #94a3b8));
  transition: transform 100ms ease;
}
 
.gb-row:hover .gb-row__chevron {
  transform: translateX(2px);
  color: var(--gb-text-secondary, var(--gb-text-muted, #64748b));
}
`;

function ensureControlMenuButtonStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("control-menu-button-styles")) return;

  const style = document.createElement("style");
  style.id = "control-menu-button-styles";
  style.textContent = BUTTON_STYLE;
  document.head.appendChild(style);
}

function escapeControlMenuButtonHtml(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function controlMenuButton(buttonId, icon, text, value = "", options = {}) {
  ensureControlMenuButtonStyles();

  const idAttr = buttonId ? ` id="${escapeControlMenuButtonHtml(buttonId)}"` : "";
  const disabled = !!options.disabled;
  const utility = !!options.utility;
  const classes = [
    "gb-row",
    utility ? "gb-row--utility" : "",
    disabled ? "gb-row--disabled" : "",
    value ? "" : "gb-row--empty",
  ].filter(Boolean).join(" ");

  const iconHtml = icon
    ? String(icon)
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"></circle>
      </svg>`;

  const chevronHtml = `<svg class="gb-row__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>`;

  return `<button${idAttr} class="${classes}" type="button"${disabled ? " disabled" : ""}>
    <span class="gb-row__icon">${iconHtml}</span>
    <span class="gb-row__label">${escapeControlMenuButtonHtml(text)}</span>
    <span class="gb-row__value">${escapeControlMenuButtonHtml(value || options.emptyValue || "")}</span>
    ${chevronHtml}
  </button>`;
}

if (typeof window !== "undefined") {
  window.controlMenuButton = controlMenuButton;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = controlMenuButton;
}
