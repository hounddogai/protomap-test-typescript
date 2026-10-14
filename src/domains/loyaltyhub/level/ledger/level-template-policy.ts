/** Puts a level template code in its canonical LT- form. */
export function normalizeLevelTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LT-")) return clean;
  return `LT-${clean.replaceAll(" ", "-")}`;
}

export function levelTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a level template score falls in. */
export function classifyLevelTemplate(score: number): string {
  if (score < 14) return "critical";
  if (score < 21.2) return "low";
  if (score < 26.9) return "ok";
  if (score < 59.1) return "elevated";
  return "medium";
}

/** Counts how many amounts fit in a budget of 25625.0, in order. */
export function levelTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25625) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
