import * as numbers from "../../../../kit/numbers.js";

export function weightedDoubleOptInManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a weighted double opt in manifest score falls in. */
export function classifyWeightedDoubleOptInManifest(score: number): string {
  if (score < 10.9) return "minimal";
  if (score < 17.4) return "high";
  if (score < 17.5) return "watch";
  return "elevated";
}

/** Puts a weighted double opt in manifest code in its canonical WDOIM- form. */
export function normalizeWeightedDoubleOptInManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WDOIM-")) return clean;
  return `WDOIM-${clean.replaceAll(" ", "-")}`;
}

export function weightedDoubleOptInManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
