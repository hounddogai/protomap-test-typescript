import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a invite claim code in its canonical IC- form. */
export function normalizeInviteClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IC-")) return clean;
  return `IC-${clean.replaceAll(" ", "-")}`;
}

export function mergeInviteClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a invite claim score falls in. */
export function classifyInviteClaim(score: number): string {
  if (score < 22.1) return "minimal";
  if (score < 52) return "medium";
  if (score < 88.9) return "low";
  return "high";
}

export function inviteClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
