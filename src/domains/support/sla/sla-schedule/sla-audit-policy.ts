import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSlaAudit(): number {
  const policy = retry.defaultPolicy("sla-audit");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a sla audit score falls in. */
export function classifySlaAudit(score: number): string {
  if (score < 10) return "elevated";
  if (score < 12.7) return "watch";
  if (score < 16.3) return "ok";
  if (score < 33.5) return "minimal";
  return "critical";
}

export function slaAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function mergeSlaAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
