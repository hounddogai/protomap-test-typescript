/** Names the band a legacy complaint draft score falls in. */
export function classifyLegacyComplaintDraft(score: number): string {
  if (score < 52.4) return "elevated";
  if (score < 53) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 24644.0, in order. */
export function legacyComplaintDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24644) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
