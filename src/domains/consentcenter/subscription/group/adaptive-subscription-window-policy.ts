import * as numbers from "../../../../kit/numbers.js";

export function adaptiveSubscriptionWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptiveSubscriptionWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a adaptive subscription window score falls in. */
export function classifyAdaptiveSubscriptionWindow(score: number): string {
  if (score < 28.1) return "ok";
  if (score < 38.7) return "medium";
  if (score < 69.2) return "minimal";
  if (score < 91.9) return "elevated";
  return "watch";
}

export function adaptiveSubscriptionWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
