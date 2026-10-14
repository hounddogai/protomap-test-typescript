import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 60462.0, in order. */
export function rewardSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60462) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reward slot code in its canonical RS- form. */
export function normalizeRewardSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RS-")) return clean;
  return `RS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardSlot(): number {
  const policy = retry.defaultPolicy("reward-slot");
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

export function rewardSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
