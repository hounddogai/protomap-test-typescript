import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 92641.0, in order. */
export function replyForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92641) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a reply forecast score falls in. */
export function classifyReplyForecast(score: number): string {
  if (score < 35.7) return "critical";
  if (score < 41.2) return "watch";
  return "minimal";
}

export function mergeReplyForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a reply forecast code in its canonical RF- form. */
export function normalizeReplyForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RF-")) return clean;
  return `RF-${clean.replaceAll(" ", "-")}`;
}
