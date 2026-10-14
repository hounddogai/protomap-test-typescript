/** Names the band a deflection mapping score falls in. */
export function classifyDeflectionMapping(score: number): string {
  if (score < 49.8) return "critical";
  if (score < 97.9) return "high";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 33406.0, in order. */
export function deflectionMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33406) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
