import { globalModelTierBucket } from "../../model/segment/global-model-tier-policy.js";
import { GlobalModelTier } from "../../model/segment/global-model-tier.js";
import { TieredTouchpointWindow, newTieredTouchpointWindow } from "./tiered-touchpoint-window.js";

export function summarizeGlobalModelTiersForWindow(items: GlobalModelTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredTouchpointWindowsFromTier(items: GlobalModelTier[]): TieredTouchpointWindow[] {
  const out: TieredTouchpointWindow[] = [];
  for (const item of items) {
    const derived = newTieredTouchpointWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateTieredTouchpointWindow(item: TieredTouchpointWindow): string {
  return globalModelTierBucket(item.projectedTotal());
}
