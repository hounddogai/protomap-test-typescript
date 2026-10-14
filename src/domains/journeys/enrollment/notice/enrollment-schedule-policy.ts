import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function enrollmentScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function enrollmentScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function mergeEnrollmentScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a enrollment schedule code in its canonical ES- form. */
export function normalizeEnrollmentScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ES-")) return clean;
  return `ES-${clean.replaceAll(" ", "-")}`;
}
