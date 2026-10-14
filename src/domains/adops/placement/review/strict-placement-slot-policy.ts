import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a strict placement slot score falls in. */
export function classifyStrictPlacementSlot(score: number): string {
  if (score < 18.6) return "ok";
  if (score < 24.2) return "watch";
  if (score < 78.9) return "elevated";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictPlacementSlot(): number {
  const policy = retry.defaultPolicy("strict-placement-slot");
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

export function strictPlacementSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function strictPlacementSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
