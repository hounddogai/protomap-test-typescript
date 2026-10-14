import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a seasonal warmup window score falls in. */
export function classifySeasonalWarmupWindow(score: number): string {
  if (score < 75.8) return "low";
  if (score < 87.5) return "ok";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalWarmupWindow(): number {
  const policy = retry.defaultPolicy("seasonal-warmup-window");
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

export function mergeSeasonalWarmupWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
