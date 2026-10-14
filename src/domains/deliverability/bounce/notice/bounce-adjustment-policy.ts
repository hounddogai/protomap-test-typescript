import * as retry from "../../../../kit/retry.js";

/** Puts a bounce adjustment code in its canonical BA- form. */
export function normalizeBounceAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BA-")) return clean;
  return `BA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBounceAdjustment(): number {
  const policy = retry.defaultPolicy("bounce-adjustment");
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

/** Names the band a bounce adjustment score falls in. */
export function classifyBounceAdjustment(score: number): string {
  if (score < 64.6) return "elevated";
  if (score < 95.2) return "low";
  return "critical";
}

/** Counts how many amounts fit in a budget of 79370.0, in order. */
export function bounceAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79370) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
