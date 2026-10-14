import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 66669.0, in order. */
export function reputationMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66669) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reputation metric code in its canonical RM- form. */
export function normalizeReputationMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RM-")) return clean;
  return `RM-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReputationMetric(): number {
  const policy = retry.defaultPolicy("reputation-metric");
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
