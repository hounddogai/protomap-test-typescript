import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function suppressionEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSuppressionEntry(): number {
  const policy = retry.defaultPolicy("suppression-entry");
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

export function mergeSuppressionEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a suppression entry score falls in. */
export function classifySuppressionEntry(score: number): string {
  if (score < 5.6) return "minimal";
  if (score < 28.9) return "watch";
  if (score < 56.2) return "high";
  if (score < 59.4) return "ok";
  return "low";
}
