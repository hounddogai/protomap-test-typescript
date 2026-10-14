import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictInviteGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 80229.0, in order. */
export function strictInviteGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80229) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a strict invite group code in its canonical SIG- form. */
export function normalizeStrictInviteGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIG-")) return clean;
  return `SIG-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict invite group score falls in. */
export function classifyStrictInviteGroup(score: number): string {
  if (score < 8.5) return "critical";
  if (score < 10.7) return "minimal";
  if (score < 36.7) return "elevated";
  return "low";
}
