import { classifyFallbackActivationSlot } from "../slot/fallback-activation-slot-policy.js";
import { TieredActivationEstimate } from "../slot/tiered-activation-estimate.js";
import { LegacyActivationEstimate, newLegacyActivationEstimate } from "./legacy-activation-estimate.js";

export function summarizeTieredActivationEstimatesForEstimate(items: TieredActivationEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveLegacyActivationEstimatesFromEstimate(items: TieredActivationEstimate[]): LegacyActivationEstimate[] {
  const out: LegacyActivationEstimate[] = [];
  for (const item of items) {
    const derived = newLegacyActivationEstimate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLegacyActivationEstimate(item: LegacyActivationEstimate): string {
  return classifyFallbackActivationSlot(item.adjustedValue());
}
