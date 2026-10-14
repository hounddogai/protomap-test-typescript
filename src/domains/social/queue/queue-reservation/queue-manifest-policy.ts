/** Puts a queue manifest code in its canonical QM- form. */
export function normalizeQueueManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QM-")) return clean;
  return `QM-${clean.replaceAll(" ", "-")}`;
}

export function queueManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
