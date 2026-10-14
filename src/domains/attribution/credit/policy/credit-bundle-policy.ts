import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditBundle(): number {
  const policy = retry.defaultPolicy("credit-bundle");
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

/** Names the band a credit bundle score falls in. */
export function classifyCreditBundle(score: number): string {
  if (score < 49.3) return "minimal";
  if (score < 52.1) return "high";
  if (score < 90.1) return "watch";
  if (score < 95.9) return "ok";
  return "elevated";
}
