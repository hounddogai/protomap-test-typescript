export function primaryInviteReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 6533.0, in order. */
export function primaryInviteReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6533) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary invite reservation code in its canonical PIR- form. */
export function normalizePrimaryInviteReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PIR-")) return clean;
  return `PIR-${clean.replaceAll(" ", "-")}`;
}
