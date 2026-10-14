import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a pending bid rule plan score falls in. */
export function classifyPendingBidRulePlan(score: number): string {
  if (score < 27) return "elevated";
  if (score < 27.1) return "watch";
  if (score < 69.1) return "high";
  if (score < 76.5) return "ok";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingBidRulePlan(): number {
  const policy = retry.defaultPolicy("pending-bid-rule-plan");
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

export function pendingBidRulePlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a pending bid rule plan code in its canonical PBRP- form. */
export function normalizePendingBidRulePlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PBRP-")) return clean;
  return `PBRP-${clean.replaceAll(" ", "-")}`;
}
