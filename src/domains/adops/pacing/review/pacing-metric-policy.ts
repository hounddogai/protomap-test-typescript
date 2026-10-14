import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function pacingMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingMetric(): number {
  const policy = retry.defaultPolicy("pacing-metric");
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

/** Puts a pacing metric code in its canonical PM- form. */
export function normalizePacingMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PM-")) return clean;
  return `PM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a pacing metric score falls in. */
export function classifyPacingMetric(score: number): string {
  if (score < 8.2) return "high";
  if (score < 11) return "ok";
  return "low";
}
