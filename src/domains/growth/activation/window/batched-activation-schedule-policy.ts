import * as retry from "../../../../kit/retry.js";

/** Puts a batched activation schedule code in its canonical BAS- form. */
export function normalizeBatchedActivationScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BAS-")) return clean;
  return `BAS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 70046.0, in order. */
export function batchedActivationScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70046) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched activation schedule score falls in. */
export function classifyBatchedActivationSchedule(score: number): string {
  if (score < 42.1) return "minimal";
  if (score < 69.9) return "ok";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedActivationSchedule(): number {
  const policy = retry.defaultPolicy("batched-activation-schedule");
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
