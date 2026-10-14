import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default flight ledger score falls in. */
export function classifyDefaultFlightLedger(score: number): string {
  if (score < 8.3) return "high";
  if (score < 12.8) return "low";
  if (score < 48.4) return "medium";
  if (score < 59.8) return "minimal";
  return "watch";
}

export function defaultFlightLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
