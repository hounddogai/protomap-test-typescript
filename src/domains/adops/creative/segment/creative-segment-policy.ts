import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a creative segment score falls in. */
export function classifyCreativeSegment(score: number): string {
  if (score < 4.9) return "elevated";
  if (score < 21.6) return "ok";
  if (score < 22) return "low";
  return "watch";
}

export function creativeSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreativeSegment(): number {
  const policy = retry.defaultPolicy("creative-segment");
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
