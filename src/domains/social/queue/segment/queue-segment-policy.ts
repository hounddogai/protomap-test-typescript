import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a queue segment score falls in. */
export function classifyQueueSegment(score: number): string {
  if (score < 16.1) return "watch";
  if (score < 56) return "elevated";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeQueueSegment(): number {
  const policy = retry.defaultPolicy("queue-segment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a queue segment code in its canonical QS- form. */
export function normalizeQueueSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QS-")) return clean;
  return `QS-${clean.replaceAll(" ", "-")}`;
}

export function queueSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
