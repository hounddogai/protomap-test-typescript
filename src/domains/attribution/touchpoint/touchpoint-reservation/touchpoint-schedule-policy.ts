import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTouchpointSchedule(): number {
  const policy = retry.defaultPolicy("touchpoint-schedule");
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

/** Puts a touchpoint schedule code in its canonical TS- form. */
export function normalizeTouchpointScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TS-")) return clean;
  return `TS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 32603.0, in order. */
export function touchpointScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32603) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function touchpointScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
