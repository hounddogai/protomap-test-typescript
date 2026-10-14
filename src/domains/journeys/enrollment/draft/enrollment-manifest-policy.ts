import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeEnrollmentManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a enrollment manifest code in its canonical EM- form. */
export function normalizeEnrollmentManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EM-")) return clean;
  return `EM-${clean.replaceAll(" ", "-")}`;
}
