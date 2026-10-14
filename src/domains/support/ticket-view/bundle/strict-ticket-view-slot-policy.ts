/** Puts a strict ticket view slot code in its canonical STVS- form. */
export function normalizeStrictTicketViewSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STVS-")) return clean;
  return `STVS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 24218.0, in order. */
export function strictTicketViewSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24218) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
