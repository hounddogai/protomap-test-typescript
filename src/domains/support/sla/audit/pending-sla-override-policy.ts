import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function pendingSlaOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingSlaOverride(): number {
  const policy = retry.defaultPolicy("pending-sla-override");
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

/** Names the band a pending sla override score falls in. */
export function classifyPendingSlaOverride(score: number): string {
  if (score < 26.8) return "critical";
  if (score < 85.7) return "high";
  return "ok";
}
