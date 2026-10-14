import * as numbers from "../../../../kit/numbers.js";

export function inviteWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.06;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a invite window code in its canonical IW- form. */
export function normalizeInviteWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IW-")) return clean;
  return `IW-${clean.replaceAll(" ", "-")}`;
}
