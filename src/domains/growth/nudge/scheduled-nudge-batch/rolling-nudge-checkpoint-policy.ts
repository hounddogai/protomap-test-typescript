import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rollingNudgeCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingNudgeCheckpoint(): number {
  const policy = retry.defaultPolicy("rolling-nudge-checkpoint");
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

/** Names the band a rolling nudge checkpoint score falls in. */
export function classifyRollingNudgeCheckpoint(score: number): string {
  if (score < 43.6) return "ok";
  if (score < 55) return "elevated";
  if (score < 77.4) return "watch";
  if (score < 90.5) return "low";
  return "medium";
}

export function rollingNudgeCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
