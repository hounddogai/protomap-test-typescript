import { FunnelVariance } from "../../funnel/variance/funnel-variance.js";
import { seasonalFunnelManifestBucket } from "../../funnel/variance/seasonal-funnel-manifest-policy.js";
import { PaywallSnapshot, newPaywallSnapshot } from "./paywall-snapshot.js";

export function summarizeFunnelVariancesForSnapshot(items: FunnelVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePaywallSnapshotsFromVariance(items: FunnelVariance[]): PaywallSnapshot[] {
  const out: PaywallSnapshot[] = [];
  for (const item of items) {
    const derived = newPaywallSnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPaywallSnapshot(item: PaywallSnapshot): string {
  return seasonalFunnelManifestBucket(item.weightedVolume());
}
