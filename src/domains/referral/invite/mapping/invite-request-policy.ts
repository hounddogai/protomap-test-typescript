import * as numbers from "../../../../kit/numbers.js";

/** Names the band a invite request score falls in. */
export function classifyInviteRequest(score: number): string {
  if (score < 14.3) return "ok";
  if (score < 49.4) return "minimal";
  return "medium";
}

/** Puts a invite request code in its canonical IR- form. */
export function normalizeInviteRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IR-")) return clean;
  return `IR-${clean.replaceAll(" ", "-")}`;
}

export function inviteRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
