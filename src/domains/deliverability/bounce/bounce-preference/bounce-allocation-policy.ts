import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a bounce allocation code in its canonical BA- form. */
export function normalizeBounceAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BA-")) return clean;
  return `BA-${clean.replaceAll(" ", "-")}`;
}

export function bounceAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBounceAllocation(): number {
  const policy = retry.defaultPolicy("bounce-allocation");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a bounce allocation score falls in. */
export function classifyBounceAllocation(score: number): string {
  if (score < 48.3) return "ok";
  if (score < 50.6) return "high";
  return "low";
}
