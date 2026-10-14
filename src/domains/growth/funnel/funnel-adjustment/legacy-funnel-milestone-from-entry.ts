import { normalizeAdaptivePaywallThresholdCode } from "../../paywall/threshold/adaptive-paywall-threshold-policy.js";
import { PendingPaywallEntry } from "../../paywall/threshold/pending-paywall-entry.js";
import { LegacyFunnelMilestone, newLegacyFunnelMilestone } from "./legacy-funnel-milestone.js";

export function summarizePendingPaywallEntriesForMilestone(items: PendingPaywallEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLegacyFunnelMilestonesFromEntry(items: PendingPaywallEntry[]): LegacyFunnelMilestone[] {
  const out: LegacyFunnelMilestone[] = [];
  for (const item of items) {
    const derived = newLegacyFunnelMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLegacyFunnelMilestone(item: LegacyFunnelMilestone): string {
  return normalizeAdaptivePaywallThresholdCode(item.code);
}
