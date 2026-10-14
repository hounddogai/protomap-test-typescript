/** Puts a badge proposal code in its canonical BP- form. */
export function normalizeBadgeProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BP-")) return clean;
  return `BP-${clean.replaceAll(" ", "-")}`;
}

export function badgeProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
