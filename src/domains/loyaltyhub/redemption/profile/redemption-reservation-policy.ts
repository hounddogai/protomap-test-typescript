import * as numbers from "../../../../kit/numbers.js";

/** Names the band a redemption reservation score falls in. */
export function classifyRedemptionReservation(score: number): string {
  if (score < 19.9) return "high";
  if (score < 85.7) return "ok";
  if (score < 89.4) return "minimal";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 74411.0, in order. */
export function redemptionReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74411) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function redemptionReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function redemptionReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
