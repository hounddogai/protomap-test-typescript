import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveQueueTemplate(): number {
  const policy = retry.defaultPolicy("adaptive-queue-template");
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

export function adaptiveQueueTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a adaptive queue template score falls in. */
export function classifyAdaptiveQueueTemplate(score: number): string {
  if (score < 11.4) return "minimal";
  if (score < 32) return "ok";
  if (score < 72.6) return "low";
  return "high";
}
