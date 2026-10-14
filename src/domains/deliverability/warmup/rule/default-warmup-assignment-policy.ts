import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a default warmup assignment score falls in. */
export function classifyDefaultWarmupAssignment(score: number): string {
  if (score < 16) return "medium";
  if (score < 16.5) return "critical";
  if (score < 86.7) return "elevated";
  return "minimal";
}

export function mergeDefaultWarmupAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultWarmupAssignment(): number {
  const policy = retry.defaultPolicy("default-warmup-assignment");
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
