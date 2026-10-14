import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict ticket view manifest code in its canonical STVM- form. */
export function normalizeStrictTicketViewManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STVM-")) return clean;
  return `STVM-${clean.replaceAll(" ", "-")}`;
}

export function strictTicketViewManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
