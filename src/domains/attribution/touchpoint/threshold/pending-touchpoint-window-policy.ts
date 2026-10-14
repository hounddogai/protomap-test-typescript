/** Puts a pending touchpoint window code in its canonical PTW- form. */
export function normalizePendingTouchpointWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PTW-")) return clean;
  return `PTW-${clean.replaceAll(" ", "-")}`;
}

export function pendingTouchpointWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
