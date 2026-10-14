import * as numbers from "../../../../kit/numbers.js";

export function inviteDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function inviteDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 94572.0, in order. */
export function inviteDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94572) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a invite draft score falls in. */
export function classifyInviteDraft(score: number): string {
  if (score < 5.1) return "medium";
  if (score < 34.3) return "critical";
  if (score < 90.7) return "watch";
  return "ok";
}
