import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a wait group code in its canonical WG- form. */
export function normalizeWaitGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WG-")) return clean;
  return `WG-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a wait group score falls in. */
export function classifyWaitGroup(score: number): string {
  if (score < 5.6) return "low";
  if (score < 33.5) return "ok";
  if (score < 89.8) return "high";
  if (score < 91.8) return "minimal";
  return "elevated";
}

export function mergeWaitGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function waitGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
