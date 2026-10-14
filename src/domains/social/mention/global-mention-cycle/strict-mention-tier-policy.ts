import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict mention tier score falls in. */
export function classifyStrictMentionTier(score: number): string {
  if (score < 6) return "medium";
  if (score < 48.7) return "high";
  if (score < 81.4) return "low";
  if (score < 84.4) return "ok";
  return "elevated";
}

export function mergeStrictMentionTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictMentionTier(): number {
  const policy = retry.defaultPolicy("strict-mention-tier");
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

export function strictMentionTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
