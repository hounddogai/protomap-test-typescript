import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a pending invite slot score falls in. */
export function classifyPendingInviteSlot(score: number): string {
  if (score < 4) return "minimal";
  if (score < 95.9) return "medium";
  return "high";
}

export function mergePendingInviteSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a pending invite slot code in its canonical PIS- form. */
export function normalizePendingInviteSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PIS-")) return clean;
  return `PIS-${clean.replaceAll(" ", "-")}`;
}
