import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function lenientRetentionDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a lenient retention draft score falls in. */
export function classifyLenientRetentionDraft(score: number): string {
  if (score < 1.8) return "high";
  if (score < 24.8) return "low";
  if (score < 69.7) return "critical";
  if (score < 81.9) return "elevated";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientRetentionDraft(): number {
  const policy = retry.defaultPolicy("lenient-retention-draft");
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

export function mergeLenientRetentionDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
