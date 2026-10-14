import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a default conversion metric code in its canonical DCM- form. */
export function normalizeDefaultConversionMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCM-")) return clean;
  return `DCM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 83784.0, in order. */
export function defaultConversionMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83784) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function defaultConversionMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultConversionMetric(): number {
  const policy = retry.defaultPolicy("default-conversion-metric");
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
