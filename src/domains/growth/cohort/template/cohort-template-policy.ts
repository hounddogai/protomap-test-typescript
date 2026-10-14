import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCohortTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a cohort template score falls in. */
export function classifyCohortTemplate(score: number): string {
  if (score < 3.3) return "elevated";
  if (score < 68.2) return "ok";
  if (score < 74.3) return "low";
  return "medium";
}
