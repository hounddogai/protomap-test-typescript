import * as numbers from "../../../../kit/numbers.js";

export function inviteCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a invite checkpoint code in its canonical IC- form. */
export function normalizeInviteCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IC-")) return clean;
  return `IC-${clean.replaceAll(" ", "-")}`;
}
