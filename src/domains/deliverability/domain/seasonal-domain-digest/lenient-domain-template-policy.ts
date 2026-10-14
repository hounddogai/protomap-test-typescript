import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function lenientDomainTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientDomainTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a lenient domain template score falls in. */
export function classifyLenientDomainTemplate(score: number): string {
  if (score < 45.9) return "elevated";
  if (score < 81.8) return "watch";
  if (score < 97.4) return "high";
  return "critical";
}

export function mergeLenientDomainTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
