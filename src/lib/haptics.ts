// Web haptics with two backends:
// - navigator.vibrate (Android Chrome) — supports duration/patterns
// - iOS Safari 18+: toggling a hidden <input type="checkbox" switch> via its
//   label fires the system haptic tick (no vibrate API on iOS)
const MIN_INTERVAL_MS = 30;

let lastTick = 0;
let iosLabel: HTMLLabelElement | null = null;

function ensureIosSwitch(): HTMLLabelElement {
  if (iosLabel && document.body.contains(iosLabel)) return iosLabel;

  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none;";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;

  label.appendChild(input);
  document.body.appendChild(label);
  iosLabel = label;
  return label;
}

/**
 * Fire a haptic tick. `pattern` only affects devices with the Vibration API
 * (Android); on iOS every tick has fixed system intensity.
 */
export function haptic(pattern: number | number[] = 10, force = false): void {
  if (typeof window === "undefined") return;

  const now = performance.now();
  if (!force && now - lastTick < MIN_INTERVAL_MS) return;
  lastTick = now;

  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
      return;
    }
    ensureIosSwitch().click();
  } catch {
    // Haptics are decorative — never let them break interaction
  }
}
