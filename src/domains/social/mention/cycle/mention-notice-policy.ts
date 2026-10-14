import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a mention notice code in its canonical MN- form. */
export function normalizeMentionNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MN-")) return clean;
  return `MN-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a mention notice score falls in. */
export function classifyMentionNotice(score: number): string {
  if (score < 40.6) return "elevated";
  if (score < 60.6) return "minimal";
  return "ok";
}

export function mentionNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function mergeMentionNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
