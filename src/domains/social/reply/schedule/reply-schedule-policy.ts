/** Puts a reply schedule code in its canonical RS- form. */
export function normalizeReplyScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RS-")) return clean;
  return `RS-${clean.replaceAll(" ", "-")}`;
}

export function replyScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
