import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 51488.0, in order. */
export function funnelPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51488) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a funnel plan code in its canonical FP- form. */
export function normalizeFunnelPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FP-")) return clean;
  return `FP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFunnelPlan(): number {
  const policy = retry.defaultPolicy("funnel-plan");
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
