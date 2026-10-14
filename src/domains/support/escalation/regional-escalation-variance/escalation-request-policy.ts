import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a escalation request score falls in. */
export function classifyEscalationRequest(score: number): string {
  if (score < 3.7) return "low";
  if (score < 61) return "elevated";
  return "medium";
}

export function mergeEscalationRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
