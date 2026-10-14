import { classifySlaPolicy } from "../../sla/policy/sla-policy-policy.js";
import { SlaPolicy } from "../../sla/policy/sla-policy.js";
import { AdaptiveCsatTarget, newAdaptiveCsatTarget } from "./adaptive-csat-target.js";

export function summarizeSlaPoliciesForTarget(items: SlaPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveCsatTargetsFromPolicy(items: SlaPolicy[]): AdaptiveCsatTarget[] {
  const out: AdaptiveCsatTarget[] = [];
  for (const item of items) {
    const derived = newAdaptiveCsatTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveCsatTarget(item: AdaptiveCsatTarget): string {
  return classifySlaPolicy(item.adjustedValue());
}
