/** Puts a adaptive creative budget code in its canonical ACB- form. */
export function normalizeAdaptiveCreativeBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACB-")) return clean;
  return `ACB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 85151.0, in order. */
export function adaptiveCreativeBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85151) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
