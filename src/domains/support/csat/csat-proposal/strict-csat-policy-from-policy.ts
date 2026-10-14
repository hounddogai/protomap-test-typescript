import { classifyPrimaryMacroQuota } from "../../macro/macro-quota/primary-macro-quota-policy.js";
import { TieredMacroPolicy } from "../../macro/macro-quota/tiered-macro-policy.js";
import { StrictCsatPolicy, newStrictCsatPolicy } from "./strict-csat-policy.js";

export function summarizeTieredMacroPoliciesForPolicy(items: TieredMacroPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveStrictCsatPoliciesFromPolicy(items: TieredMacroPolicy[]): StrictCsatPolicy[] {
  const out: StrictCsatPolicy[] = [];
  for (const item of items) {
    const derived = newStrictCsatPolicy(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectStrictCsatPolicy(item: StrictCsatPolicy): string {
  return classifyPrimaryMacroQuota(item.weightedTotal());
}
