/** Counts how many amounts fit in a budget of 17438.0, in order. */
export function activationAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17438) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a activation audit code in its canonical AA- form. */
export function normalizeActivationAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AA-")) return clean;
  return `AA-${clean.replaceAll(" ", "-")}`;
}
