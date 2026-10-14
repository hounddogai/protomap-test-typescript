/** Names the band a capped csat manifest score falls in. */
export function classifyCappedCsatManifest(score: number): string {
  if (score < 21.9) return "critical";
  if (score < 48.8) return "low";
  if (score < 95) return "medium";
  return "watch";
}

/** Counts how many amounts fit in a budget of 4051.0, in order. */
export function cappedCsatManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4051) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function cappedCsatManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
