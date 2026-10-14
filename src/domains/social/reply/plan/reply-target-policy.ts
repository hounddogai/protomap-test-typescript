import * as retry from "../../../../kit/retry.js";

/** Puts a reply target code in its canonical RT- form. */
export function normalizeReplyTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RT-")) return clean;
  return `RT-${clean.replaceAll(" ", "-")}`;
}

export function replyTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a reply target score falls in. */
export function classifyReplyTarget(score: number): string {
  if (score < 22.4) return "high";
  if (score < 93.6) return "watch";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReplyTarget(): number {
  const policy = retry.defaultPolicy("reply-target");
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
