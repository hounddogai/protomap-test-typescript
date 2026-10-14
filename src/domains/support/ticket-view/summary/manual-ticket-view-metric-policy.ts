import * as numbers from "../../../../kit/numbers.js";

export function manualTicketViewMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a manual ticket view metric code in its canonical MTVM- form. */
export function normalizeManualTicketViewMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MTVM-")) return clean;
  return `MTVM-${clean.replaceAll(" ", "-")}`;
}
