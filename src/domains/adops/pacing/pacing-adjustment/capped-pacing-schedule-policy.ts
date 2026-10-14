import * as numbers from "../../../../kit/numbers.js";

export function cappedPacingScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a capped pacing schedule code in its canonical CPS- form. */
export function normalizeCappedPacingScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPS-")) return clean;
  return `CPS-${clean.replaceAll(" ", "-")}`;
}
