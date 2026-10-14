import * as numbers from "../../../../kit/numbers.js";

/** Names the band a suppression notice score falls in. */
export function classifySuppressionNotice(score: number): string {
  if (score < 5.7) return "ok";
  if (score < 73.3) return "critical";
  return "low";
}

/** Counts how many amounts fit in a budget of 35721.0, in order. */
export function suppressionNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 35721) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function suppressionNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
