import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeInviteSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a invite summary score falls in. */
export function classifyInviteSummary(score: number): string {
  if (score < 60.1) return "low";
  if (score < 94.8) return "minimal";
  return "ok";
}

/** Puts a invite summary code in its canonical IS- form. */
export function normalizeInviteSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IS-")) return clean;
  return `IS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 64386.0, in order. */
export function inviteSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64386) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
