import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function queueNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Puts a queue notice code in its canonical QN- form. */
export function normalizeQueueNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QN-")) return clean;
  return `QN-${clean.replaceAll(" ", "-")}`;
}

export function mergeQueueNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
