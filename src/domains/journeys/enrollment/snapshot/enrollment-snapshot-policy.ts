import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a enrollment snapshot score falls in. */
export function classifyEnrollmentSnapshot(score: number): string {
  if (score < 33.8) return "medium";
  if (score < 82) return "elevated";
  if (score < 96.8) return "high";
  return "ok";
}

export function enrollmentSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a enrollment snapshot code in its canonical ES- form. */
export function normalizeEnrollmentSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ES-")) return clean;
  return `ES-${clean.replaceAll(" ", "-")}`;
}

export function mergeEnrollmentSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
