import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 52532.0, in order. */
export function badgeTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52532) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeBadgeTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a badge template score falls in. */
export function classifyBadgeTemplate(score: number): string {
  if (score < 72.5) return "critical";
  if (score < 74.1) return "high";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBadgeTemplate(): number {
  const policy = retry.defaultPolicy("badge-template");
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
