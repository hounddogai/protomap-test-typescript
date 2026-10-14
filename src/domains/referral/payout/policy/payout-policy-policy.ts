import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutPolicy(): number {
  const policy = retry.defaultPolicy("payout-policy");
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

/** Puts a payout policy code in its canonical PP- form. */
export function normalizePayoutPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 70762.0, in order. */
export function payoutPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70762) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a payout policy score falls in. */
export function classifyPayoutPolicy(score: number): string {
  if (score < 26.9) return "watch";
  if (score < 37.5) return "critical";
  if (score < 83.9) return "high";
  return "medium";
}
