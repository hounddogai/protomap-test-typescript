import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function tieredWindowExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredWindowException(): number {
  const policy = retry.defaultPolicy("tiered-window-exception");
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

/** Names the band a tiered window exception score falls in. */
export function classifyTieredWindowException(score: number): string {
  if (score < 30.7) return "minimal";
  if (score < 86) return "watch";
  if (score < 87.5) return "medium";
  return "low";
}
