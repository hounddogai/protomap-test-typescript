import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a invite adjustment score falls in. */
export function classifyInviteAdjustment(score: number): string {
  if (score < 49.8) return "minimal";
  if (score < 87.5) return "ok";
  return "high";
}

export function inviteAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function mergeInviteAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a invite adjustment code in its canonical IA- form. */
export function normalizeInviteAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IA-")) return clean;
  return `IA-${clean.replaceAll(" ", "-")}`;
}
