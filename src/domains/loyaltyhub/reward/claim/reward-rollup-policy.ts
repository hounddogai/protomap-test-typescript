import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a reward rollup score falls in. */
export function classifyRewardRollup(score: number): string {
  if (score < 38.3) return "high";
  if (score < 44.5) return "minimal";
  return "medium";
}

export function rewardRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRollup(): number {
  const policy = retry.defaultPolicy("reward-rollup");
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

/** Puts a reward rollup code in its canonical RR- form. */
export function normalizeRewardRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}
