import * as numbers from "../../../../kit/numbers.js";

/** Puts a invite milestone code in its canonical IM- form. */
export function normalizeInviteMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IM-")) return clean;
  return `IM-${clean.replaceAll(" ", "-")}`;
}

export function inviteMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
