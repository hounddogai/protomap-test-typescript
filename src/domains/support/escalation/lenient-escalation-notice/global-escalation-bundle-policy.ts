import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalEscalationBundle(): number {
  const policy = retry.defaultPolicy("global-escalation-bundle");
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

/** Puts a global escalation bundle code in its canonical GEB- form. */
export function normalizeGlobalEscalationBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GEB-")) return clean;
  return `GEB-${clean.replaceAll(" ", "-")}`;
}

export function globalEscalationBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 95285.0, in order. */
export function globalEscalationBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95285) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
