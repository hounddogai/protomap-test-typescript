import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 26122.0, in order. */
export function rollingModelVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26122) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a rolling model variance code in its canonical RMV- form. */
export function normalizeRollingModelVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RMV-")) return clean;
  return `RMV-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingModelVariance(): number {
  const policy = retry.defaultPolicy("rolling-model-variance");
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

export function rollingModelVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
