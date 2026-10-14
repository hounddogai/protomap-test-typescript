import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTicketViewAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 54329.0, in order. */
export function ticketViewAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54329) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a ticket view assignment code in its canonical TVA- form. */
export function normalizeTicketViewAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVA-")) return clean;
  return `TVA-${clean.replaceAll(" ", "-")}`;
}
