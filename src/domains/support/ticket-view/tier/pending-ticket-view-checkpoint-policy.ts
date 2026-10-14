import * as numbers from "../../../../kit/numbers.js";

export function pendingTicketViewCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a pending ticket view checkpoint score falls in. */
export function classifyPendingTicketViewCheckpoint(score: number): string {
  if (score < 23.9) return "watch";
  if (score < 40.7) return "low";
  if (score < 87.8) return "ok";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 39758.0, in order. */
export function pendingTicketViewCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39758) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
