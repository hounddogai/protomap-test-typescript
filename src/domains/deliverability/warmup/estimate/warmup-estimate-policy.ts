import * as retry from "../../../../kit/retry.js";

/** Puts a warmup estimate code in its canonical WE- form. */
export function normalizeWarmupEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WE-")) return clean;
  return `WE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 18694.0, in order. */
export function warmupEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18694) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWarmupEstimate(): number {
  const policy = retry.defaultPolicy("warmup-estimate");
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
