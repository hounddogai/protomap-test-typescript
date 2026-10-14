import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackActivationAllocation(): number {
  const policy = retry.defaultPolicy("fallback-activation-allocation");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeFallbackActivationAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a fallback activation allocation score falls in. */
export function classifyFallbackActivationAllocation(score: number): string {
  if (score < 6) return "medium";
  if (score < 30.1) return "watch";
  if (score < 71) return "low";
  if (score < 74.9) return "critical";
  return "elevated";
}

/** Puts a fallback activation allocation code in its canonical FAA- form. */
export function normalizeFallbackActivationAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FAA-")) return clean;
  return `FAA-${clean.replaceAll(" ", "-")}`;
}
