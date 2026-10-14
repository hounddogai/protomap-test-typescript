import * as numbers from "../../../../kit/numbers.js";

export function replyLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.21;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a reply ledger score falls in. */
export function classifyReplyLedger(score: number): string {
  if (score < 75.6) return "medium";
  if (score < 79) return "ok";
  if (score < 92.2) return "low";
  return "critical";
}
