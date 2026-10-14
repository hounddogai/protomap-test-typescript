import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function proofExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeProofException(): number {
  const policy = retry.defaultPolicy("proof-exception");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a proof exception score falls in. */
export function classifyProofException(score: number): string {
  if (score < 15.7) return "watch";
  if (score < 23.5) return "elevated";
  if (score < 92.3) return "high";
  return "critical";
}
