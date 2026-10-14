import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeConversionRequest(): number {
  const policy = retry.defaultPolicy("conversion-request");
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

/** Names the band a conversion request score falls in. */
export function classifyConversionRequest(score: number): string {
  if (score < 37.1) return "ok";
  if (score < 75) return "high";
  return "elevated";
}
