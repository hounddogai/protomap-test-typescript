import { defaultStepBundleBucket } from "../../step/plan/default-step-bundle-policy.js";
import { RegionalStepAudit } from "../../step/plan/regional-step-audit.js";
import { GlobalExitRuleAllocation, newGlobalExitRuleAllocation } from "./global-exit-rule-allocation.js";

export function summarizeRegionalStepAuditsForAllocation(items: RegionalStepAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveGlobalExitRuleAllocationsFromAudit(items: RegionalStepAudit[]): GlobalExitRuleAllocation[] {
  const out: GlobalExitRuleAllocation[] = [];
  for (const item of items) {
    const derived = newGlobalExitRuleAllocation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectGlobalExitRuleAllocation(item: GlobalExitRuleAllocation): string {
  return defaultStepBundleBucket(item.netLoad());
}
