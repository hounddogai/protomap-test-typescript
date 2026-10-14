import * as numbers from "../../../../kit/numbers.js";

export function batchedConversionTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function batchedConversionTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched conversion target score falls in. */
export function classifyBatchedConversionTarget(score: number): string {
  if (score < 87.4) return "critical";
  if (score < 96.6) return "high";
  return "ok";
}
