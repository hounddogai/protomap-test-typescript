import * as numbers from "../../../../kit/numbers.js";

export function weightedTicketViewDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a weighted ticket view digest code in its canonical WTVD- form. */
export function normalizeWeightedTicketViewDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WTVD-")) return clean;
  return `WTVD-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 56487.0, in order. */
export function weightedTicketViewDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56487) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a weighted ticket view digest score falls in. */
export function classifyWeightedTicketViewDigest(score: number): string {
  if (score < 16.1) return "watch";
  if (score < 77.1) return "high";
  if (score < 87) return "medium";
  return "minimal";
}
