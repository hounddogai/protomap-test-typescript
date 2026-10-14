import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTouchpointReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a touchpoint reservation code in its canonical TR- form. */
export function normalizeTouchpointReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TR-")) return clean;
  return `TR-${clean.replaceAll(" ", "-")}`;
}
