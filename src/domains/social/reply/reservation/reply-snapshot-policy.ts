export function replySnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a reply snapshot code in its canonical RS- form. */
export function normalizeReplySnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RS-")) return clean;
  return `RS-${clean.replaceAll(" ", "-")}`;
}
