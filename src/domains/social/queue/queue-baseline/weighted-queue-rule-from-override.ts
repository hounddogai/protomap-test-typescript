import { classifyGlobalApprovalAudit } from "../../approval/override-item/global-approval-audit-policy.js";
import { RegionalApprovalOverride } from "../../approval/override-item/regional-approval-override.js";
import { WeightedQueueRule, newWeightedQueueRule } from "./weighted-queue-rule.js";

export function summarizeRegionalApprovalOverridesForRule(items: RegionalApprovalOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveWeightedQueueRulesFromOverride(items: RegionalApprovalOverride[]): WeightedQueueRule[] {
  const out: WeightedQueueRule[] = [];
  for (const item of items) {
    const derived = newWeightedQueueRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeWeightedQueueRuleExtra(item: WeightedQueueRule): string {
  return classifyGlobalApprovalAudit(item.effectiveVolume());
}
