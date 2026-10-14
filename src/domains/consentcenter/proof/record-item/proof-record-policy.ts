import * as numbers from "../../../../kit/numbers.js";

/** Names the band a proof record score falls in. */
export function classifyProofRecord(score: number): string {
  if (score < 2.4) return "elevated";
  if (score < 85.8) return "low";
  return "high";
}

export function proofRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
