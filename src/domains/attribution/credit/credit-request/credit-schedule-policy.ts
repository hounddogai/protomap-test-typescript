import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditSchedule(): number {
  const policy = retry.defaultPolicy("credit-schedule");
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

/** Counts how many amounts fit in a budget of 80056.0, in order. */
export function creditScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80056) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a credit schedule code in its canonical CS- form. */
export function normalizeCreditScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CS-")) return clean;
  return `CS-${clean.replaceAll(" ", "-")}`;
}
