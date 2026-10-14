import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a frequency policy code in its canonical FP- form. */
export function normalizeFrequencyPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FP-")) return clean;
  return `FP-${clean.replaceAll(" ", "-")}`;
}

export function frequencyPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyPolicy(): number {
  const policy = retry.defaultPolicy("frequency-policy");
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

/** Names the band a frequency policy score falls in. */
export function classifyFrequencyPolicy(score: number): string {
  if (score < 57) return "watch";
  if (score < 71.6) return "low";
  return "high";
}
