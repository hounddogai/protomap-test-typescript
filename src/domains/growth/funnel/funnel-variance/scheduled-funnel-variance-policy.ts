/** Puts a scheduled funnel variance code in its canonical SFV- form. */
export function normalizeScheduledFunnelVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFV-")) return clean;
  return `SFV-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a scheduled funnel variance score falls in. */
export function classifyScheduledFunnelVariance(score: number): string {
  if (score < 8.6) return "ok";
  if (score < 12.5) return "high";
  if (score < 42.2) return "elevated";
  if (score < 91.1) return "minimal";
  return "critical";
}

/** Counts how many amounts fit in a budget of 57941.0, in order. */
export function scheduledFunnelVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57941) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
