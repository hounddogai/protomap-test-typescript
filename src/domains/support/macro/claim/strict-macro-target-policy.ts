/** Puts a strict macro target code in its canonical SMT- form. */
export function normalizeStrictMacroTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMT-")) return clean;
  return `SMT-${clean.replaceAll(" ", "-")}`;
}

export function strictMacroTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
