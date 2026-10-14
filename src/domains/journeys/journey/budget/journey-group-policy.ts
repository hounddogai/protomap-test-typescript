/** Names the band a journey group score falls in. */
export function classifyJourneyGroup(score: number): string {
  if (score < 8.1) return "watch";
  if (score < 19.1) return "medium";
  if (score < 23.7) return "elevated";
  if (score < 93) return "critical";
  return "high";
}

/** Counts how many amounts fit in a budget of 22208.0, in order. */
export function journeyGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22208) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a journey group code in its canonical JG- form. */
export function normalizeJourneyGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("JG-")) return clean;
  return `JG-${clean.replaceAll(" ", "-")}`;
}
