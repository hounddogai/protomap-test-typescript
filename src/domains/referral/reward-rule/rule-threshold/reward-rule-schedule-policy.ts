import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRewardRuleScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a reward rule schedule score falls in. */
export function classifyRewardRuleSchedule(score: number): string {
  if (score < 45.8) return "low";
  if (score < 69) return "ok";
  return "critical";
}
