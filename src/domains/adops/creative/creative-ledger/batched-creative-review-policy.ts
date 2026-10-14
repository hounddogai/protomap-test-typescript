import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a batched creative review code in its canonical BCR- form. */
export function normalizeBatchedCreativeReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BCR-")) return clean;
  return `BCR-${clean.replaceAll(" ", "-")}`;
}

export function batchedCreativeReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedCreativeReview(): number {
  const policy = retry.defaultPolicy("batched-creative-review");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a batched creative review score falls in. */
export function classifyBatchedCreativeReview(score: number): string {
  if (score < 21.9) return "watch";
  if (score < 42.9) return "critical";
  if (score < 63.2) return "elevated";
  return "ok";
}
