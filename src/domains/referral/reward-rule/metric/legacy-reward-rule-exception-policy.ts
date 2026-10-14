/** Puts a legacy reward rule exception code in its canonical LRRE- form. */
export function normalizeLegacyRewardRuleExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRRE-")) return clean;
  return `LRRE-${clean.replaceAll(" ", "-")}`;
}

export function legacyRewardRuleExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
