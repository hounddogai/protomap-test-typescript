import * as numbers from "../../../../kit/numbers.js";

export function fraudCheckExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a fraud check exception score falls in. */
export function classifyFraudCheckException(score: number): string {
  if (score < 15.2) return "medium";
  if (score < 21.7) return "low";
  if (score < 43.3) return "elevated";
  if (score < 74.3) return "ok";
  return "critical";
}
