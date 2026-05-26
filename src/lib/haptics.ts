export function hapticSuccess(): void {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* unsupported */
  }
}

export function hapticWarning(): void {
  try {
    navigator.vibrate?.([20, 40, 20]);
  } catch {
    /* unsupported */
  }
}
