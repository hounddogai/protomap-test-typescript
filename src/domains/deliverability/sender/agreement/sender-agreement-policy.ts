import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a sender agreement score falls in. */
export function classifySenderAgreement(score: number): string {
  if (score < 6) return "medium";
  if (score < 9.2) return "high";
  return "ok";
}

export function mergeSenderAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
