import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function weightedFrequencySlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedFrequencySlot(): number {
  const policy = retry.defaultPolicy("weighted-frequency-slot");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a weighted frequency slot score falls in. */
export function classifyWeightedFrequencySlot(score: number): string {
  if (score < 63.3) return "watch";
  if (score < 72.1) return "critical";
  if (score < 91.9) return "low";
  return "elevated";
}
