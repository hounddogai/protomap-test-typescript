import * as numbers from "../../../../kit/numbers.js";

/** Names the band a mention batch score falls in. */
export function classifyMentionBatch(score: number): string {
  if (score < 31.6) return "high";
  if (score < 64.1) return "minimal";
  return "watch";
}

export function mentionBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mentionBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
