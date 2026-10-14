import * as retry from "../../../../kit/retry.js";

/** Names the band a flight template score falls in. */
export function classifyFlightTemplate(score: number): string {
  if (score < 38.5) return "minimal";
  if (score < 40) return "watch";
  if (score < 95) return "critical";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFlightTemplate(): number {
  const policy = retry.defaultPolicy("flight-template");
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
