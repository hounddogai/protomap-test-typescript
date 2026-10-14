import { classifyFunnelManifest } from "../../funnel/manifest/funnel-manifest-policy.js";
import { FunnelProfile } from "../../funnel/manifest/funnel-profile.js";
import { PaywallMilestone, newPaywallMilestone } from "./paywall-milestone.js";

export function summarizeFunnelProfilesForMilestone(items: FunnelProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePaywallMilestonesFromProfile(items: FunnelProfile[]): PaywallMilestone[] {
  const out: PaywallMilestone[] = [];
  for (const item of items) {
    const derived = newPaywallMilestone(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planPaywallMilestone(item: PaywallMilestone): string {
  return classifyFunnelManifest(item.measuredValue());
}
