import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a default reply proposal code in its canonical DRP- form. */
export function normalizeDefaultReplyProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DRP-")) return clean;
  return `DRP-${clean.replaceAll(" ", "-")}`;
}

export function defaultReplyProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function mergeDefaultReplyProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default reply proposal score falls in. */
export function classifyDefaultReplyProposal(score: number): string {
  if (score < 67.3) return "minimal";
  if (score < 99.5) return "low";
  return "watch";
}
