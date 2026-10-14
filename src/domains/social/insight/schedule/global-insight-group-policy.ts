/** Puts a global insight group code in its canonical GIG- form. */
export function normalizeGlobalInsightGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GIG-")) return clean;
  return `GIG-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 25074.0, in order. */
export function globalInsightGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25074) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
