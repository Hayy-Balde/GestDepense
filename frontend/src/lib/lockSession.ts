export function lockSession() {
  window.dispatchEvent(new Event("ft-lock-manual"));
}
