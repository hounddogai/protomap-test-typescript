import * as numbers from "../../../../kit/numbers.js";

export function proofAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function proofAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a proof agreement code in its canonical PA- form. */
export function normalizeProofAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PA-")) return clean;
  return `PA-${clean.replaceAll(" ", "-")}`;
}
