import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function journeyScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a journey score score falls in. */
export function classifyJourneyScore(score: number): string {
  if (score < 36.3) return "critical";
  if (score < 50.6) return "medium";
  if (score < 94.5) return "high";
  if (score < 98.9) return "elevated";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeJourneyScore(): number {
  const policy = retry.defaultPolicy("journey-score");
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

export function mergeJourneyScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
