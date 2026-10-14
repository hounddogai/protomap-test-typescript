import * as numbers from "../../../../kit/numbers.js";

export function ticketViewAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 52122.0, in order. */
export function ticketViewAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52122) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function ticketViewAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a ticket view agreement score falls in. */
export function classifyTicketViewAgreement(score: number): string {
  if (score < 37.7) return "watch";
  if (score < 59.5) return "elevated";
  if (score < 60.4) return "high";
  return "ok";
}
