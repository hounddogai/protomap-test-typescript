import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mentionSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a mention segment score falls in. */
export function classifyMentionSegment(score: number): string {
  if (score < 11.4) return "medium";
  if (score < 33.9) return "low";
  if (score < 38.3) return "high";
  if (score < 92.4) return "critical";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMentionSegment(): number {
  const policy = retry.defaultPolicy("mention-segment");
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

export function mergeMentionSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
