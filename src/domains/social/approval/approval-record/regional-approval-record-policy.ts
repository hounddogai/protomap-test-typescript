import * as numbers from "../../../../kit/numbers.js";

/** Names the band a regional approval record score falls in. */
export function classifyRegionalApprovalRecord(score: number): string {
  if (score < 22.8) return "watch";
  if (score < 54.2) return "ok";
  return "high";
}

export function regionalApprovalRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
