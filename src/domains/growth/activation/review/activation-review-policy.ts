import * as numbers from "../../../../kit/numbers.js";

/** Names the band a activation review score falls in. */
export function classifyActivationReview(score: number): string {
  if (score < 2.9) return "elevated";
  if (score < 18.1) return "critical";
  if (score < 79.2) return "low";
  if (score < 96.4) return "watch";
  return "medium";
}

export function activationReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a activation review code in its canonical AR- form. */
export function normalizeActivationReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AR-")) return clean;
  return `AR-${clean.replaceAll(" ", "-")}`;
}
