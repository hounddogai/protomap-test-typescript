import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 94636.0, in order. */
export function primaryPayoutOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94636) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary payout override code in its canonical PPO- form. */
export function normalizePrimaryPayoutOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPO-")) return clean;
  return `PPO-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary payout override score falls in. */
export function classifyPrimaryPayoutOverride(score: number): string {
  if (score < 14.2) return "watch";
  if (score < 24.6) return "low";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryPayoutOverride(): number {
  const policy = retry.defaultPolicy("primary-payout-override");
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
