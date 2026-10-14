export function bidRuleDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a bid rule digest code in its canonical BRD- form. */
export function normalizeBidRuleDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRD-")) return clean;
  return `BRD-${clean.replaceAll(" ", "-")}`;
}
