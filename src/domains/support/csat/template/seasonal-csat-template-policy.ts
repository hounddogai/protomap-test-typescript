/** Counts how many amounts fit in a budget of 99630.0, in order. */
export function seasonalCsatTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99630) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a seasonal csat template code in its canonical SCT- form. */
export function normalizeSeasonalCsatTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCT-")) return clean;
  return `SCT-${clean.replaceAll(" ", "-")}`;
}

export function seasonalCsatTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a seasonal csat template score falls in. */
export function classifySeasonalCsatTemplate(score: number): string {
  if (score < 22.9) return "critical";
  if (score < 28.6) return "low";
  if (score < 59.6) return "high";
  if (score < 93.3) return "ok";
  return "minimal";
}
