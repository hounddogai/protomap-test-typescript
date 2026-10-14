import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultNudgeExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultNudgeException(): number {
  const policy = retry.defaultPolicy("default-nudge-exception");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a default nudge exception score falls in. */
export function classifyDefaultNudgeException(score: number): string {
  if (score < 35.9) return "ok";
  if (score < 48.5) return "critical";
  return "low";
}
