import { normalizeDeflectionBudgetCode } from "../../deflection/tier/deflection-budget-policy.js";
import { DeflectionTier } from "../../deflection/tier/deflection-tier.js";
import { MacroException, newMacroException } from "./macro-exception.js";

export function summarizeDeflectionTiersForException(items: DeflectionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveMacroExceptionsFromTier(items: DeflectionTier[]): MacroException[] {
  const out: MacroException[] = [];
  for (const item of items) {
    const derived = newMacroException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateMacroException(item: MacroException): string {
  return normalizeDeflectionBudgetCode(item.code);
}
