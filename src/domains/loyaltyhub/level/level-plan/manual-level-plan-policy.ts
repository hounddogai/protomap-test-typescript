/** Counts how many amounts fit in a budget of 64564.0, in order. */
export function manualLevelPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64564) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a manual level plan code in its canonical MLP- form. */
export function normalizeManualLevelPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MLP-")) return clean;
  return `MLP-${clean.replaceAll(" ", "-")}`;
}
