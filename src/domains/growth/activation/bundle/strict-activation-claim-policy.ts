import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 68976.0, in order. */
export function strictActivationClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68976) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a strict activation claim code in its canonical SAC- form. */
export function normalizeStrictActivationClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SAC-")) return clean;
  return `SAC-${clean.replaceAll(" ", "-")}`;
}

export function strictActivationClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictActivationClaim(): number {
  const policy = retry.defaultPolicy("strict-activation-claim");
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
