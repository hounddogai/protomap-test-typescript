import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a capped touchpoint snapshot code in its canonical CTS- form. */
export function normalizeCappedTouchpointSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CTS-")) return clean;
  return `CTS-${clean.replaceAll(" ", "-")}`;
}

export function mergeCappedTouchpointSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
