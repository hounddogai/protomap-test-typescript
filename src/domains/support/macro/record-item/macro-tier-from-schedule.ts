import { DeflectionSchedule } from "../../deflection/summary/deflection-schedule.js";
import { normalizeDeflectionTemplateCode } from "../../deflection/summary/deflection-template-policy.js";
import { MacroTier, newMacroTier } from "./macro-tier.js";

export function summarizeDeflectionSchedulesForTier(items: DeflectionSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveMacroTiersFromSchedule(items: DeflectionSchedule[]): MacroTier[] {
  const out: MacroTier[] = [];
  for (const item of items) {
    const derived = newMacroTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileMacroTier(item: MacroTier): string {
  return normalizeDeflectionTemplateCode(item.code);
}
