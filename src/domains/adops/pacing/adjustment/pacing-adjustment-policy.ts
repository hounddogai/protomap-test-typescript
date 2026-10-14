import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a pacing adjustment score falls in. */
export function classifyPacingAdjustment(score: number): string {
  if (score < 8.7) return "ok";
  if (score < 36.1) return "critical";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingAdjustment(): number {
  const policy = retry.defaultPolicy("pacing-adjustment");
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

/** Counts how many amounts fit in a budget of 81147.0, in order. */
export function pacingAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81147) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePacingAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
