import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientRewardRuleMilestone(): number {
  const policy = retry.defaultPolicy("lenient-reward-rule-milestone");
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

/** Puts a lenient reward rule milestone code in its canonical LRRM- form. */
export function normalizeLenientRewardRuleMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRRM-")) return clean;
  return `LRRM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient reward rule milestone score falls in. */
export function classifyLenientRewardRuleMilestone(score: number): string {
  if (score < 75.8) return "medium";
  if (score < 92.9) return "minimal";
  return "elevated";
}

export function lenientRewardRuleMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
