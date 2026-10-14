import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function globalEscalationRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalEscalationRecord(): number {
  const policy = retry.defaultPolicy("global-escalation-record");
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

/** Names the band a global escalation record score falls in. */
export function classifyGlobalEscalationRecord(score: number): string {
  if (score < 37.8) return "high";
  if (score < 61.8) return "minimal";
  if (score < 95.3) return "low";
  if (score < 96.2) return "critical";
  return "elevated";
}

export function mergeGlobalEscalationRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
