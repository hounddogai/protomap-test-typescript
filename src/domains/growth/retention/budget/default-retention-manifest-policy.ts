import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function defaultRetentionManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a default retention manifest code in its canonical DRM- form. */
export function normalizeDefaultRetentionManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DRM-")) return clean;
  return `DRM-${clean.replaceAll(" ", "-")}`;
}

export function mergeDefaultRetentionManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
