import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostForecast(): number {
  const policy = retry.defaultPolicy("post-forecast");
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

/** Puts a post forecast code in its canonical PF- form. */
export function normalizePostForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PF-")) return clean;
  return `PF-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a post forecast score falls in. */
export function classifyPostForecast(score: number): string {
  if (score < 68.4) return "critical";
  if (score < 75.5) return "medium";
  if (score < 94.7) return "low";
  return "elevated";
}

export function postForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
