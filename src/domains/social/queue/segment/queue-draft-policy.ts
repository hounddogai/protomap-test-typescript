import * as numbers from "../../../../kit/numbers.js";

/** Names the band a queue draft score falls in. */
export function classifyQueueDraft(score: number): string {
  if (score < 3.6) return "elevated";
  if (score < 63) return "minimal";
  if (score < 83.7) return "medium";
  return "low";
}

export function queueDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.09;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
