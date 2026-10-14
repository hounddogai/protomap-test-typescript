/** Puts a manual touchpoint target code in its canonical MTT- form. */
export function normalizeManualTouchpointTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MTT-")) return clean;
  return `MTT-${clean.replaceAll(" ", "-")}`;
}

export function manualTouchpointTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
