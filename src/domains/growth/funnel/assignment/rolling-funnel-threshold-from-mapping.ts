import { ManualRetentionMapping } from "../../retention/retention-record/manual-retention-mapping.js";
import {
  normalizeTieredRetentionBudgetCode,
} from "../../retention/retention-record/tiered-retention-budget-policy.js";
import { RollingFunnelThreshold, newRollingFunnelThreshold } from "./rolling-funnel-threshold.js";

export function summarizeManualRetentionMappingsForThreshold(items: ManualRetentionMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRollingFunnelThresholdsFromMapping(items: ManualRetentionMapping[]): RollingFunnelThreshold[] {
  const out: RollingFunnelThreshold[] = [];
  for (const item of items) {
    const derived = newRollingFunnelThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRollingFunnelThreshold(item: RollingFunnelThreshold): string {
  return normalizeTieredRetentionBudgetCode(item.code);
}
