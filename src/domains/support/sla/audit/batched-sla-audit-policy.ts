import * as numbers from "../../../../kit/numbers.js";

export function batchedSlaAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a batched sla audit score falls in. */
export function classifyBatchedSlaAudit(score: number): string {
  if (score < 18.3) return "elevated";
  if (score < 63.1) return "high";
  if (score < 65.1) return "medium";
  if (score < 77.6) return "watch";
  return "critical";
}
