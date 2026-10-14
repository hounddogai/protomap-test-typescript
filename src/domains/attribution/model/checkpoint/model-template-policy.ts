/** Counts how many amounts fit in a budget of 85415.0, in order. */
export function modelTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85415) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a model template code in its canonical MT- form. */
export function normalizeModelTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MT-")) return clean;
  return `MT-${clean.replaceAll(" ", "-")}`;
}
