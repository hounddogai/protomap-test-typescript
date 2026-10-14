import * as numbers from "../../../../kit/numbers.js";

/** Names the band a adaptive approval agreement score falls in. */
export function classifyAdaptiveApprovalAgreement(score: number): string {
  if (score < 2.1) return "watch";
  if (score < 37.2) return "medium";
  if (score < 60.1) return "high";
  if (score < 99.8) return "critical";
  return "elevated";
}

/** Puts a adaptive approval agreement code in its canonical AAA- form. */
export function normalizeAdaptiveApprovalAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AAA-")) return clean;
  return `AAA-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveApprovalAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function adaptiveApprovalAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
