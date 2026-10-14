export function modelGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a model group code in its canonical MG- form. */
export function normalizeModelGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MG-")) return clean;
  return `MG-${clean.replaceAll(" ", "-")}`;
}
