import * as numbers from "../../../../kit/numbers.js";

export function paywallSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a paywall summary score falls in. */
export function classifyPaywallSummary(score: number): string {
  if (score < 5.7) return "high";
  if (score < 11.3) return "watch";
  if (score < 55.1) return "ok";
  return "low";
}

export function paywallSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
