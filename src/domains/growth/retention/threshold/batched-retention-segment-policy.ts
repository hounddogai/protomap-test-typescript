import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedRetentionSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedRetentionSegment(): number {
  const policy = retry.defaultPolicy("batched-retention-segment");
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

/** Puts a batched retention segment code in its canonical BRS- form. */
export function normalizeBatchedRetentionSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRS-")) return clean;
  return `BRS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a batched retention segment score falls in. */
export function classifyBatchedRetentionSegment(score: number): string {
  if (score < 76.1) return "critical";
  if (score < 81) return "watch";
  return "high";
}
