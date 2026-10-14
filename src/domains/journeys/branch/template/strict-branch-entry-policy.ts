import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict branch entry score falls in. */
export function classifyStrictBranchEntry(score: number): string {
  if (score < 7.8) return "minimal";
  if (score < 17.2) return "ok";
  if (score < 62.7) return "medium";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictBranchEntry(): number {
  const policy = retry.defaultPolicy("strict-branch-entry");
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

export function mergeStrictBranchEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
