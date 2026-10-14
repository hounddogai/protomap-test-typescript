import { adaptiveFlightQuotaBucket } from "../../flight/flight-quota/adaptive-flight-quota-policy.js";
import { AdaptiveFlightQuota } from "../../flight/flight-quota/adaptive-flight-quota.js";
import { FallbackPlacementAudit, newFallbackPlacementAudit } from "./fallback-placement-audit.js";

export function summarizeAdaptiveFlightQuotasForAudit(items: AdaptiveFlightQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveFallbackPlacementAuditsFromQuota(items: AdaptiveFlightQuota[]): FallbackPlacementAudit[] {
  const out: FallbackPlacementAudit[] = [];
  for (const item of items) {
    const derived = newFallbackPlacementAudit(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreFallbackPlacementAudit(item: FallbackPlacementAudit): string {
  return adaptiveFlightQuotaBucket(item.effectiveExposure());
}
