import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function batchedSuppressionAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function mergeBatchedSuppressionAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedSuppressionAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a batched suppression agreement score falls in. */
export function classifyBatchedSuppressionAgreement(score: number): string {
  if (score < 67.2) return "medium";
  if (score < 71.9) return "low";
  if (score < 83.9) return "ok";
  return "minimal";
}
