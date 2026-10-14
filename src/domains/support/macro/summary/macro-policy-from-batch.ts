import { CsatBatch } from "../../csat/request/csat-batch.js";
import { csatRequestWeight } from "../../csat/request/csat-request-policy.js";
import { MacroPolicy, newMacroPolicy } from "./macro-policy.js";

export function summarizeCsatBatchesForPolicy(items: CsatBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveMacroPoliciesFromBatch(items: CsatBatch[]): MacroPolicy[] {
  const out: MacroPolicy[] = [];
  for (const item of items) {
    const derived = newMacroPolicy(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeMacroPolicy(item: MacroPolicy): number {
  return csatRequestWeight(6, true);
}
