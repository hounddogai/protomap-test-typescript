import { classifyManualRetentionQuota } from "../../retention/quota/manual-retention-quota-policy.js";
import { ScheduledRetentionWindow } from "../../retention/quota/scheduled-retention-window.js";
import { RollingActivationSummary, newRollingActivationSummary } from "./rolling-activation-summary.js";

export function summarizeScheduledRetentionWindowsForSummary(items: ScheduledRetentionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRollingActivationSummariesFromWindow(items: ScheduledRetentionWindow[]): RollingActivationSummary[] {
  const out: RollingActivationSummary[] = [];
  for (const item of items) {
    const derived = newRollingActivationSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeRollingActivationSummary(item: RollingActivationSummary): string {
  return classifyManualRetentionQuota(item.measuredValue());
}
