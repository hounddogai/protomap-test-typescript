import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedSenderQuota(): number {
  const policy = retry.defaultPolicy("capped-sender-quota");
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

/** Counts how many amounts fit in a budget of 35408.0, in order. */
export function cappedSenderQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 35408) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeCappedSenderQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a capped sender quota score falls in. */
export function classifyCappedSenderQuota(score: number): string {
  if (score < 20.4) return "medium";
  if (score < 21.1) return "minimal";
  if (score < 48) return "critical";
  return "high";
}
