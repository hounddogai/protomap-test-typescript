import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyEscalationNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function legacyEscalationNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a legacy escalation notice code in its canonical LEN- form. */
export function normalizeLegacyEscalationNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LEN-")) return clean;
  return `LEN-${clean.replaceAll(" ", "-")}`;
}
