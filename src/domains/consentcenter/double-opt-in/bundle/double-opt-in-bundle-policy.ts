import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDoubleOptInBundle(): number {
  const policy = retry.defaultPolicy("double-opt-in-bundle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function doubleOptInBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.02;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a double opt in bundle code in its canonical DOIB- form. */
export function normalizeDoubleOptInBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIB-")) return clean;
  return `DOIB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 91152.0, in order. */
export function doubleOptInBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91152) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
