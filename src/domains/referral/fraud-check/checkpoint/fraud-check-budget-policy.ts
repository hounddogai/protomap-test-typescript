import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFraudCheckBudget(): number {
  const policy = retry.defaultPolicy("fraud-check-budget");
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

/** Puts a fraud check budget code in its canonical FCB- form. */
export function normalizeFraudCheckBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCB-")) return clean;
  return `FCB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 22802.0, in order. */
export function fraudCheckBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22802) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fraud check budget score falls in. */
export function classifyFraudCheckBudget(score: number): string {
  if (score < 10.4) return "low";
  if (score < 80.7) return "watch";
  return "high";
}
