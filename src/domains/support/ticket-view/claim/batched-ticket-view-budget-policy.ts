import * as numbers from "../../../../kit/numbers.js";

export function batchedTicketViewBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a batched ticket view budget code in its canonical BTVB- form. */
export function normalizeBatchedTicketViewBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BTVB-")) return clean;
  return `BTVB-${clean.replaceAll(" ", "-")}`;
}
