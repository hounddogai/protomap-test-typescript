import * as numbers from "../../../../kit/numbers.js";

export function legacyDomainBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a legacy domain batch score falls in. */
export function classifyLegacyDomainBatch(score: number): string {
  if (score < 82.4) return "low";
  if (score < 84.8) return "critical";
  if (score < 86.1) return "high";
  return "watch";
}
