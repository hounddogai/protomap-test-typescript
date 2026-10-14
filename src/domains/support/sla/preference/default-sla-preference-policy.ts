import * as numbers from "../../../../kit/numbers.js";

export function defaultSlaPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a default sla preference code in its canonical DSP- form. */
export function normalizeDefaultSlaPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DSP-")) return clean;
  return `DSP-${clean.replaceAll(" ", "-")}`;
}

export function defaultSlaPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
