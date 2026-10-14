import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional invite digest code in its canonical RID- form. */
export function normalizeRegionalInviteDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RID-")) return clean;
  return `RID-${clean.replaceAll(" ", "-")}`;
}

export function regionalInviteDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
