import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a default exit rule forecast score falls in. */
export function classifyDefaultExitRuleForecast(score: number): string {
  if (score < 21.5) return "elevated";
  if (score < 62.9) return "medium";
  if (score < 67.9) return "high";
  if (score < 93.8) return "watch";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultExitRuleForecast(): number {
  const policy = retry.defaultPolicy("default-exit-rule-forecast");
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

export function defaultExitRuleForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
