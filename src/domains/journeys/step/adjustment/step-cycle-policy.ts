import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepCycle(): number {
  const policy = retry.defaultPolicy("step-cycle");
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

export function stepCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function stepCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a step cycle score falls in. */
export function classifyStepCycle(score: number): string {
  if (score < 3.3) return "ok";
  if (score < 14.5) return "medium";
  if (score < 89.1) return "high";
  if (score < 93.9) return "watch";
  return "critical";
}
