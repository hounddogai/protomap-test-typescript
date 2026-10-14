import { strictCsatQuotaWeight } from "../../csat/csat-draft/strict-csat-quota-policy.js";
import { StrictCsatQuota } from "../../csat/csat-draft/strict-csat-quota.js";
import { MacroBaseline, newMacroBaseline } from "./macro-baseline.js";

export function summarizeStrictCsatQuotasForBaseline(items: StrictCsatQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveMacroBaselinesFromQuota(items: StrictCsatQuota[]): MacroBaseline[] {
  const out: MacroBaseline[] = [];
  for (const item of items) {
    const derived = newMacroBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeMacroBaseline(item: MacroBaseline): number {
  return strictCsatQuotaWeight(1, true);
}
