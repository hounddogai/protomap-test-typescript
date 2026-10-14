/** Counts how many amounts fit in a budget of 37882.0, in order. */
export function journeyMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37882) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function journeyMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a journey milestone code in its canonical JM- form. */
export function normalizeJourneyMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("JM-")) return clean;
  return `JM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a journey milestone score falls in. */
export function classifyJourneyMilestone(score: number): string {
  if (score < 36.4) return "minimal";
  if (score < 55) return "watch";
  if (score < 82.6) return "low";
  if (score < 83.9) return "ok";
  return "medium";
}
