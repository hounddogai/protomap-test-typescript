/** Counts how many amounts fit in a budget of 24391.0, in order. */
export function conversionMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24391) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a conversion mapping code in its canonical CM- form. */
export function normalizeConversionMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CM-")) return clean;
  return `CM-${clean.replaceAll(" ", "-")}`;
}
