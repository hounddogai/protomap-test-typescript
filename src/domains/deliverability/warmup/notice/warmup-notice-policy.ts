import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a warmup notice score falls in. */
export function classifyWarmupNotice(score: number): string {
  if (score < 58.6) return "ok";
  if (score < 60.2) return "low";
  return "critical";
}

export function mergeWarmupNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWarmupNotice(): number {
  const policy = retry.defaultPolicy("warmup-notice");
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
