/** Counts how many amounts fit in a budget of 77442.0, in order. */
export function batchedDeflectionBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77442) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a batched deflection bundle code in its canonical BDB- form. */
export function normalizeBatchedDeflectionBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BDB-")) return clean;
  return `BDB-${clean.replaceAll(" ", "-")}`;
}
