import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function fallbackJourneyTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a fallback journey template score falls in. */
export function classifyFallbackJourneyTemplate(score: number): string {
  if (score < 51.2) return "ok";
  if (score < 70.7) return "high";
  return "critical";
}

export function mergeFallbackJourneyTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
