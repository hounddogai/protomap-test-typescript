import * as retry from "../../../../kit/retry.js";

/** Puts a lenient streak budget code in its canonical LSB- form. */
export function normalizeLenientStreakBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSB-")) return clean;
  return `LSB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 34379.0, in order. */
export function lenientStreakBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34379) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientStreakBudget(): number {
  const policy = retry.defaultPolicy("lenient-streak-budget");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
