/** Puts a funnel template code in its canonical FT- form. */
export function normalizeFunnelTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FT-")) return clean;
  return `FT-${clean.replaceAll(" ", "-")}`;
}

export function funnelTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 60363.0, in order. */
export function funnelTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60363) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
