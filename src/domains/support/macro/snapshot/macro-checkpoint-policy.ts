import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a macro checkpoint score falls in. */
export function classifyMacroCheckpoint(score: number): string {
  if (score < 16.9) return "elevated";
  if (score < 72.9) return "medium";
  if (score < 73.8) return "high";
  if (score < 94.9) return "ok";
  return "low";
}

export function macroCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMacroCheckpoint(): number {
  const policy = retry.defaultPolicy("macro-checkpoint");
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

export function macroCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
