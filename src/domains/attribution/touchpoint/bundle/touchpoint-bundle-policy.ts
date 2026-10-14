import * as retry from "../../../../kit/retry.js";

/** Names the band a touchpoint bundle score falls in. */
export function classifyTouchpointBundle(score: number): string {
  if (score < 1.7) return "high";
  if (score < 79.9) return "watch";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTouchpointBundle(): number {
  const policy = retry.defaultPolicy("touchpoint-bundle");
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
