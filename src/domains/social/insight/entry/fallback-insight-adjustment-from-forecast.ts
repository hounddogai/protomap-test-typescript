import {
  normalizeRollingApprovalProfileCode,
} from "../../approval/approval-profile/rolling-approval-profile-policy.js";
import { TieredApprovalForecast } from "../../approval/approval-profile/tiered-approval-forecast.js";
import { FallbackInsightAdjustment, newFallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

export function summarizeTieredApprovalForecastsForAdjustment(items: TieredApprovalForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFallbackInsightAdjustmentsFromForecast(items: TieredApprovalForecast[]): FallbackInsightAdjustment[] {
  const out: FallbackInsightAdjustment[] = [];
  for (const item of items) {
    const derived = newFallbackInsightAdjustment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeFallbackInsightAdjustment(item: FallbackInsightAdjustment): string {
  return normalizeRollingApprovalProfileCode(item.code);
}
