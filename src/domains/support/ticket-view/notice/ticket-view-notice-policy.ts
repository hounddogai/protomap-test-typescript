export function ticketViewNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a ticket view notice code in its canonical TVN- form. */
export function normalizeTicketViewNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVN-")) return clean;
  return `TVN-${clean.replaceAll(" ", "-")}`;
}
