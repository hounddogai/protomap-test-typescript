import * as numbers from "../../../../kit/numbers.js";

/** Names the band a ticket view slot score falls in. */
export function classifyTicketViewSlot(score: number): string {
  if (score < 8) return "elevated";
  if (score < 81.1) return "ok";
  if (score < 98.8) return "low";
  return "critical";
}

/** Counts how many amounts fit in a budget of 96595.0, in order. */
export function ticketViewSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96595) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function ticketViewSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function ticketViewSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
