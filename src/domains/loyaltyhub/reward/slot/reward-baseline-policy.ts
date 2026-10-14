import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a reward baseline code in its canonical RB- form. */
export function normalizeRewardBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RB-")) return clean;
  return `RB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a reward baseline score falls in. */
export function classifyRewardBaseline(score: number): string {
  if (score < 40.4) return "low";
  if (score < 81.6) return "watch";
  if (score < 94.7) return "high";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardBaseline(): number {
  const policy = retry.defaultPolicy("reward-baseline");
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

export function rewardBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
