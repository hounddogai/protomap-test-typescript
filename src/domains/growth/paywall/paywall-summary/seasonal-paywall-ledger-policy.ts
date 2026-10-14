/** Puts a seasonal paywall ledger code in its canonical SPL- form. */
export function normalizeSeasonalPaywallLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPL-")) return clean;
  return `SPL-${clean.replaceAll(" ", "-")}`;
}

export function seasonalPaywallLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
