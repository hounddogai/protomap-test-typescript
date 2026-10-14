import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a sender forecast score falls in. */
export function classifySenderForecast(score: number): string {
  if (score < 4.8) return "critical";
  if (score < 30.9) return "ok";
  if (score < 59.5) return "minimal";
  if (score < 77) return "elevated";
  return "watch";
}

export function senderForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderForecast(): number {
  const policy = retry.defaultPolicy("sender-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
