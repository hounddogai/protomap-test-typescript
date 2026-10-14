import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackSubscriptionQuota(): number {
  const policy = retry.defaultPolicy("fallback-subscription-quota");
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

export function fallbackSubscriptionQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 29540.0, in order. */
export function fallbackSubscriptionQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29540) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback subscription quota code in its canonical FSQ- form. */
export function normalizeFallbackSubscriptionQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FSQ-")) return clean;
  return `FSQ-${clean.replaceAll(" ", "-")}`;
}
