import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedTierNotice(): number {
  const policy = retry.defaultPolicy("weighted-tier-notice");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a weighted tier notice code in its canonical WTN- form. */
export function normalizeWeightedTierNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WTN-")) return clean;
  return `WTN-${clean.replaceAll(" ", "-")}`;
}

export function weightedTierNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
