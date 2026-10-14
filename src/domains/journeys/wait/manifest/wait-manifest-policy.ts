import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a wait manifest score falls in. */
export function classifyWaitManifest(score: number): string {
  if (score < 33) return "minimal";
  if (score < 34.9) return "medium";
  if (score < 39.1) return "high";
  return "ok";
}

/** Puts a wait manifest code in its canonical WM- form. */
export function normalizeWaitManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WM-")) return clean;
  return `WM-${clean.replaceAll(" ", "-")}`;
}

export function mergeWaitManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function waitManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
