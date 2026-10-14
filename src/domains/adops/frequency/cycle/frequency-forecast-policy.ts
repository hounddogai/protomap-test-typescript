import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyForecast(): number {
  const policy = retry.defaultPolicy("frequency-forecast");
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

/** Names the band a frequency forecast score falls in. */
export function classifyFrequencyForecast(score: number): string {
  if (score < 53.1) return "elevated";
  if (score < 96.3) return "minimal";
  return "low";
}
