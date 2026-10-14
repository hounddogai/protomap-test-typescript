import * as numbers from "../../../../kit/numbers.js";

/** Puts a primary subscription request code in its canonical PSR- form. */
export function normalizePrimarySubscriptionRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSR-")) return clean;
  return `PSR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary subscription request score falls in. */
export function classifyPrimarySubscriptionRequest(score: number): string {
  if (score < 34.6) return "ok";
  if (score < 37.2) return "low";
  if (score < 87.2) return "minimal";
  if (score < 90.5) return "high";
  return "medium";
}

export function primarySubscriptionRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
