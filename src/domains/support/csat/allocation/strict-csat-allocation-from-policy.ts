import { CsatPolicy } from "../preference/csat-policy.js";
import { normalizeCsatRuleCode } from "../preference/csat-rule-policy.js";
import { StrictCsatAllocation, newStrictCsatAllocation } from "./strict-csat-allocation.js";

export function summarizeCsatPoliciesForAllocation(items: CsatPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveStrictCsatAllocationsFromPolicy(items: CsatPolicy[]): StrictCsatAllocation[] {
  const out: StrictCsatAllocation[] = [];
  for (const item of items) {
    const derived = newStrictCsatAllocation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeStrictCsatAllocation(item: StrictCsatAllocation): string {
  return normalizeCsatRuleCode(item.code);
}
