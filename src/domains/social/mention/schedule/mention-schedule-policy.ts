import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeMentionScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a mention schedule code in its canonical MS- form. */
export function normalizeMentionScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MS-")) return clean;
  return `MS-${clean.replaceAll(" ", "-")}`;
}

export function mentionScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a mention schedule score falls in. */
export function classifyMentionSchedule(score: number): string {
  if (score < 30.6) return "ok";
  if (score < 56.3) return "minimal";
  if (score < 67.7) return "critical";
  return "elevated";
}
