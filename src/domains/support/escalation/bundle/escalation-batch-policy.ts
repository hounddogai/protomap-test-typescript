import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a escalation batch code in its canonical EB- form. */
export function normalizeEscalationBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EB-")) return clean;
  return `EB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 26598.0, in order. */
export function escalationBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26598) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationBatch(): number {
  const policy = retry.defaultPolicy("escalation-batch");
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

export function escalationBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
