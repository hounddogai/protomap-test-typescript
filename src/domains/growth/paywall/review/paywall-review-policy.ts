import * as numbers from "../../../../kit/numbers.js";

export function paywallReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a paywall review score falls in. */
export function classifyPaywallReview(score: number): string {
  if (score < 42.7) return "ok";
  if (score < 43.8) return "critical";
  if (score < 97.6) return "high";
  return "watch";
}

/** Puts a paywall review code in its canonical PR- form. */
export function normalizePaywallReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}
