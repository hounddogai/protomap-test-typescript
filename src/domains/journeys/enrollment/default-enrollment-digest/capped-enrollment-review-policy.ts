import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped enrollment review score falls in. */
export function classifyCappedEnrollmentReview(score: number): string {
  if (score < 12.8) return "medium";
  if (score < 33.8) return "minimal";
  if (score < 74.7) return "elevated";
  return "watch";
}

export function mergeCappedEnrollmentReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function cappedEnrollmentReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a capped enrollment review code in its canonical CER- form. */
export function normalizeCappedEnrollmentReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CER-")) return clean;
  return `CER-${clean.replaceAll(" ", "-")}`;
}
