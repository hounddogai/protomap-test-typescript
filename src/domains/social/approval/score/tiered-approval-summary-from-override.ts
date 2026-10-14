import { RollingQueueOverride } from "../../queue/window/rolling-queue-override.js";
import { normalizeTieredQueueForecastCode } from "../../queue/window/tiered-queue-forecast-policy.js";
import { TieredApprovalSummary, newTieredApprovalSummary } from "./tiered-approval-summary.js";

export function summarizeRollingQueueOverridesForSummary(items: RollingQueueOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredApprovalSummariesFromOverride(items: RollingQueueOverride[]): TieredApprovalSummary[] {
  const out: TieredApprovalSummary[] = [];
  for (const item of items) {
    const derived = newTieredApprovalSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateTieredApprovalSummary(item: TieredApprovalSummary): string {
  return normalizeTieredQueueForecastCode(item.code);
}
