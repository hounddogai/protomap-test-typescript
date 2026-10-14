import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global credit allocation score falls in. */
export function classifyGlobalCreditAllocation(score: number): string {
  if (score < 36.1) return "ok";
  if (score < 71.4) return "elevated";
  if (score < 89.1) return "critical";
  if (score < 90.5) return "high";
  return "low";
}

export function mergeGlobalCreditAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalCreditAllocation(): number {
  const policy = retry.defaultPolicy("global-credit-allocation");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
