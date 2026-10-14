import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 19596.0, in order. */
export function manualSubscriptionBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19596) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a manual subscription baseline code in its canonical MSB- form. */
export function normalizeManualSubscriptionBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MSB-")) return clean;
  return `MSB-${clean.replaceAll(" ", "-")}`;
}

export function manualSubscriptionBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualSubscriptionBaseline(): number {
  const policy = retry.defaultPolicy("manual-subscription-baseline");
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
