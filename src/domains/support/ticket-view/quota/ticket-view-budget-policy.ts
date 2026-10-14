import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewBudget(): number {
  const policy = retry.defaultPolicy("ticket-view-budget");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function ticketViewBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function mergeTicketViewBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a ticket view budget code in its canonical TVB- form. */
export function normalizeTicketViewBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVB-")) return clean;
  return `TVB-${clean.replaceAll(" ", "-")}`;
}
