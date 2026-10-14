import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a adaptive mention cycle score falls in. */
export function classifyAdaptiveMentionCycle(score: number): string {
  if (score < 93.8) return "critical";
  if (score < 94.2) return "elevated";
  return "high";
}

export function adaptiveMentionCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveMentionCycle(): number {
  const policy = retry.defaultPolicy("adaptive-mention-cycle");
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
