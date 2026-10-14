import { BatchedPlacementPreference } from "../../placement/group/batched-placement-preference.js";
import { normalizeBatchedPlacementTemplateCode } from "../../placement/group/batched-placement-template-policy.js";
import { CreativePlan, newCreativePlan } from "./creative-plan.js";

export function summarizeBatchedPlacementPreferencesForPlan(items: BatchedPlacementPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveCreativePlansFromPreference(items: BatchedPlacementPreference[]): CreativePlan[] {
  const out: CreativePlan[] = [];
  for (const item of items) {
    const derived = newCreativePlan(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateCreativePlan(item: CreativePlan): string {
  return normalizeBatchedPlacementTemplateCode(item.code);
}
