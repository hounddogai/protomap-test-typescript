import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function primaryModelSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a primary model slot score falls in. */
export function classifyPrimaryModelSlot(score: number): string {
  if (score < 22.6) return "ok";
  if (score < 75.3) return "low";
  if (score < 88.8) return "elevated";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryModelSlot(): number {
  const policy = retry.defaultPolicy("primary-model-slot");
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

export function primaryModelSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.21;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
