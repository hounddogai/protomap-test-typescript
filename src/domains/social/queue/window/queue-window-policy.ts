import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a queue window score falls in. */
export function classifyQueueWindow(score: number): string {
  if (score < 9.1) return "watch";
  if (score < 23.7) return "medium";
  if (score < 43.5) return "high";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeQueueWindow(): number {
  const policy = retry.defaultPolicy("queue-window");
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

export function mergeQueueWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function queueWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
