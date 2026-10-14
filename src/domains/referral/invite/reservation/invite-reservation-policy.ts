import * as numbers from "../../../../kit/numbers.js";

/** Names the band a invite reservation score falls in. */
export function classifyInviteReservation(score: number): string {
  if (score < 45.5) return "high";
  if (score < 54.9) return "critical";
  if (score < 56.5) return "low";
  if (score < 93) return "medium";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 94446.0, in order. */
export function inviteReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94446) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function inviteReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function inviteReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
