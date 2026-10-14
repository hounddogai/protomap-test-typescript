import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function globalMentionTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a global mention template score falls in. */
export function classifyGlobalMentionTemplate(score: number): string {
  if (score < 42.2) return "high";
  if (score < 46.6) return "ok";
  if (score < 63.3) return "elevated";
  if (score < 99.5) return "critical";
  return "medium";
}

export function globalMentionTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function mergeGlobalMentionTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
