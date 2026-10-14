/** Puts a default creative threshold code in its canonical DCT- form. */
export function normalizeDefaultCreativeThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCT-")) return clean;
  return `DCT-${clean.replaceAll(" ", "-")}`;
}

export function defaultCreativeThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
