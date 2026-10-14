import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a primary fraud check claim code in its canonical PFCC- form. */
export function normalizePrimaryFraudCheckClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PFCC-")) return clean;
  return `PFCC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 98477.0, in order. */
export function primaryFraudCheckClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98477) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryFraudCheckClaim(): number {
  const policy = retry.defaultPolicy("primary-fraud-check-claim");
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

export function primaryFraudCheckClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
