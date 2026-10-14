import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 54467.0, in order. */
export function rewardRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54467) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reward request code in its canonical RR- form. */
export function normalizeRewardRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRequest(): number {
  const policy = retry.defaultPolicy("reward-request");
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
