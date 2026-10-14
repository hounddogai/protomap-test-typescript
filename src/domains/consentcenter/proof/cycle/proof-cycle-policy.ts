import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function proofCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a proof cycle score falls in. */
export function classifyProofCycle(score: number): string {
  if (score < 14.7) return "critical";
  if (score < 81.8) return "high";
  if (score < 93.8) return "low";
  return "minimal";
}

export function proofCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeProofCycle(): number {
  const policy = retry.defaultPolicy("proof-cycle");
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
