import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function deflectionDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a deflection digest score falls in. */
export function classifyDeflectionDigest(score: number): string {
  if (score < 23.5) return "medium";
  if (score < 27.2) return "low";
  if (score < 48.4) return "high";
  if (score < 70.1) return "elevated";
  return "watch";
}

export function deflectionDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionDigest(): number {
  const policy = retry.defaultPolicy("deflection-digest");
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
