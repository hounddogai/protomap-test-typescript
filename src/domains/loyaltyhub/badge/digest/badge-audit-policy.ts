import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 65788.0, in order. */
export function badgeAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65788) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a badge audit score falls in. */
export function classifyBadgeAudit(score: number): string {
  if (score < 9.2) return "watch";
  if (score < 37.6) return "high";
  if (score < 55.9) return "elevated";
  return "ok";
}

export function badgeAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
