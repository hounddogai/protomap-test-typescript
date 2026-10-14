import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a primary streak threshold code in its canonical PST- form. */
export function normalizePrimaryStreakThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PST-")) return clean;
  return `PST-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary streak threshold score falls in. */
export function classifyPrimaryStreakThreshold(score: number): string {
  if (score < 4.6) return "ok";
  if (score < 53.3) return "high";
  if (score < 80) return "elevated";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryStreakThreshold(): number {
  const policy = retry.defaultPolicy("primary-streak-threshold");
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

export function primaryStreakThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
