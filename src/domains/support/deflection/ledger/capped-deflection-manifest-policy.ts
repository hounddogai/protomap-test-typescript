import * as retry from "../../../../kit/retry.js";

/** Names the band a capped deflection manifest score falls in. */
export function classifyCappedDeflectionManifest(score: number): string {
  if (score < 29.3) return "critical";
  if (score < 70.7) return "medium";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedDeflectionManifest(): number {
  const policy = retry.defaultPolicy("capped-deflection-manifest");
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
