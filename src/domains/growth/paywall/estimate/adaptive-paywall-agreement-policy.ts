import * as numbers from "../../../../kit/numbers.js";

export function adaptivePaywallAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a adaptive paywall agreement code in its canonical APA- form. */
export function normalizeAdaptivePaywallAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APA-")) return clean;
  return `APA-${clean.replaceAll(" ", "-")}`;
}
