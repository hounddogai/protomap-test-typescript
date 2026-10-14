import { classifyGlobalDeflectionAllocation } from "../../deflection/rule/global-deflection-allocation-policy.js";
import { ManualDeflectionRule } from "../../deflection/rule/manual-deflection-rule.js";
import { CappedCsatManifest, newCappedCsatManifest } from "./capped-csat-manifest.js";

export function summarizeManualDeflectionRulesForManifest(items: ManualDeflectionRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveCappedCsatManifestsFromRule(items: ManualDeflectionRule[]): CappedCsatManifest[] {
  const out: CappedCsatManifest[] = [];
  for (const item of items) {
    const derived = newCappedCsatManifest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeCappedCsatManifest(item: CappedCsatManifest): string {
  return classifyGlobalDeflectionAllocation(item.projectedTotal());
}
