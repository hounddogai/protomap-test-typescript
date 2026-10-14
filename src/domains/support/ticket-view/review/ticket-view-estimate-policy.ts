/** Counts how many amounts fit in a budget of 60047.0, in order. */
export function ticketViewEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60047) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function ticketViewEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a ticket view estimate code in its canonical TVE- form. */
export function normalizeTicketViewEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVE-")) return clean;
  return `TVE-${clean.replaceAll(" ", "-")}`;
}
