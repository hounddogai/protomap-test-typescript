import * as numbers from "../../../../kit/numbers.js";

export function pendingReplyReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a pending reply reservation score falls in. */
export function classifyPendingReplyReservation(score: number): string {
  if (score < 21.9) return "ok";
  if (score < 65) return "high";
  if (score < 78.6) return "minimal";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 6477.0, in order. */
export function pendingReplyReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6477) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pendingReplyReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
