import * as numbers from "../../../../kit/numbers.js";

export function queuePolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a queue policy score falls in. */
export function classifyQueuePolicy(score: number): string {
  if (score < 5) return "high";
  if (score < 43.5) return "elevated";
  if (score < 44.4) return "watch";
  if (score < 61.4) return "minimal";
  return "critical";
}

export function queuePolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
