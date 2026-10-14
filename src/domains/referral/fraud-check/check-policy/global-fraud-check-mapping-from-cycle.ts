import { ManualTierCycle } from "../../tier/plan/manual-tier-cycle.js";
import { tierPlanBucket } from "../../tier/plan/tier-plan-policy.js";
import { GlobalFraudCheckMapping, newGlobalFraudCheckMapping } from "./global-fraud-check-mapping.js";

export function summarizeManualTierCyclesForMapping(items: ManualTierCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalFraudCheckMappingsFromCycle(items: ManualTierCycle[]): GlobalFraudCheckMapping[] {
  const out: GlobalFraudCheckMapping[] = [];
  for (const item of items) {
    const derived = newGlobalFraudCheckMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateGlobalFraudCheckMapping(item: GlobalFraudCheckMapping): string {
  return tierPlanBucket(item.effectiveTotal());
}
