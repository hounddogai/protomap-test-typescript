import * as retry from "../../../../kit/retry.js";

/** Puts a tiered enrollment schedule code in its canonical TES- form. */
export function normalizeTieredEnrollmentScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TES-")) return clean;
  return `TES-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredEnrollmentSchedule(): number {
  const policy = retry.defaultPolicy("tiered-enrollment-schedule");
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

/** Counts how many amounts fit in a budget of 22532.0, in order. */
export function tieredEnrollmentScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22532) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
