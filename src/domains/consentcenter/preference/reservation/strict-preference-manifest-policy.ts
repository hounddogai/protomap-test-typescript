import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict preference manifest code in its canonical SPM- form. */
export function normalizeStrictPreferenceManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPM-")) return clean;
  return `SPM-${clean.replaceAll(" ", "-")}`;
}

export function strictPreferenceManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a strict preference manifest score falls in. */
export function classifyStrictPreferenceManifest(score: number): string {
  if (score < 69.9) return "critical";
  if (score < 80.8) return "elevated";
  return "ok";
}

export function strictPreferenceManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
