import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function reputationTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a reputation template score falls in. */
export function classifyReputationTemplate(score: number): string {
  if (score < 27.4) return "ok";
  if (score < 29.4) return "elevated";
  if (score < 38.7) return "critical";
  if (score < 97) return "watch";
  return "high";
}

export function mergeReputationTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReputationTemplate(): number {
  const policy = retry.defaultPolicy("reputation-template");
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
