import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingProofScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a rolling proof schedule score falls in. */
export function classifyRollingProofSchedule(score: number): string {
  if (score < 33.1) return "critical";
  if (score < 43.1) return "medium";
  if (score < 64.8) return "ok";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingProofSchedule(): number {
  const policy = retry.defaultPolicy("rolling-proof-schedule");
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
