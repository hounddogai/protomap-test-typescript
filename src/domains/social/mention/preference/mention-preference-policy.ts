import * as numbers from "../../../../kit/numbers.js";

export function mentionPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 49252.0, in order. */
export function mentionPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49252) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a mention preference score falls in. */
export function classifyMentionPreference(score: number): string {
  if (score < 12.5) return "critical";
  if (score < 13.1) return "medium";
  if (score < 95.2) return "low";
  if (score < 99.5) return "elevated";
  return "watch";
}

/** Puts a mention preference code in its canonical MP- form. */
export function normalizeMentionPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MP-")) return clean;
  return `MP-${clean.replaceAll(" ", "-")}`;
}
