import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict redemption policy score falls in. */
export function classifyStrictRedemptionPolicy(score: number): string {
  if (score < 2.4) return "critical";
  if (score < 31.1) return "watch";
  if (score < 41.9) return "elevated";
  if (score < 47.1) return "low";
  return "high";
}

export function mergeStrictRedemptionPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a strict redemption policy code in its canonical SRP- form. */
export function normalizeStrictRedemptionPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRP-")) return clean;
  return `SRP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictRedemptionPolicy(): number {
  const policy = retry.defaultPolicy("strict-redemption-policy");
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
