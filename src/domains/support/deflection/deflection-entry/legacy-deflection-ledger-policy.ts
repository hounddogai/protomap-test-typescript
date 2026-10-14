import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyDeflectionLedger(): number {
  const policy = retry.defaultPolicy("legacy-deflection-ledger");
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

export function legacyDeflectionLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 61857.0, in order. */
export function legacyDeflectionLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61857) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
