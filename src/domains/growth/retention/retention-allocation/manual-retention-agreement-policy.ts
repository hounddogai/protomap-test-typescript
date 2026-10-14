import * as numbers from "../../../../kit/numbers.js";

export function manualRetentionAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function manualRetentionAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a manual retention agreement score falls in. */
export function classifyManualRetentionAgreement(score: number): string {
  if (score < 46.7) return "minimal";
  if (score < 55.4) return "medium";
  return "ok";
}

/** Puts a manual retention agreement code in its canonical MRA- form. */
export function normalizeManualRetentionAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRA-")) return clean;
  return `MRA-${clean.replaceAll(" ", "-")}`;
}
