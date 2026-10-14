import * as numbers from "../../../../kit/numbers.js";

/** Names the band a subscription estimate score falls in. */
export function classifySubscriptionEstimate(score: number): string {
  if (score < 29.5) return "elevated";
  if (score < 65.7) return "medium";
  if (score < 87.5) return "minimal";
  if (score < 89.7) return "watch";
  return "low";
}

/** Puts a subscription estimate code in its canonical SE- form. */
export function normalizeSubscriptionEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SE-")) return clean;
  return `SE-${clean.replaceAll(" ", "-")}`;
}

export function subscriptionEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
