/** Puts a default mention adjustment code in its canonical DMA- form. */
export function normalizeDefaultMentionAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DMA-")) return clean;
  return `DMA-${clean.replaceAll(" ", "-")}`;
}

export function defaultMentionAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
