import * as numbers from "../../../../kit/numbers.js";

export function lenientComplaintLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient complaint ledger score falls in. */
export function classifyLenientComplaintLedger(score: number): string {
  if (score < 34.2) return "ok";
  if (score < 44.1) return "elevated";
  if (score < 51.5) return "high";
  if (score < 75.3) return "critical";
  return "minimal";
}
