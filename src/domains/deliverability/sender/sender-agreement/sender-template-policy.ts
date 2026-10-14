import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a sender template score falls in. */
export function classifySenderTemplate(score: number): string {
  if (score < 30.5) return "critical";
  if (score < 35.6) return "high";
  return "ok";
}

export function mergeSenderTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
