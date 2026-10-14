import * as retry from "../../../../kit/retry.js";

/** Names the band a credit baseline score falls in. */
export function classifyCreditBaseline(score: number): string {
  if (score < 19.6) return "ok";
  if (score < 60.3) return "elevated";
  if (score < 78.7) return "low";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditBaseline(): number {
  const policy = retry.defaultPolicy("credit-baseline");
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
