import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a nudge estimate score falls in. */
export function classifyNudgeEstimate(score: number): string {
  if (score < 17.1) return "watch";
  if (score < 55.5) return "medium";
  if (score < 70.1) return "ok";
  if (score < 75.9) return "minimal";
  return "elevated";
}

export function nudgeEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a nudge estimate code in its canonical NE- form. */
export function normalizeNudgeEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NE-")) return clean;
  return `NE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeNudgeEstimate(): number {
  const policy = retry.defaultPolicy("nudge-estimate");
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
