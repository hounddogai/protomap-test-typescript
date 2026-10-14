import { nudgeForecastBucket } from "../../nudge/draft/nudge-forecast-policy.js";
import { PrimaryNudgeDigest } from "../../nudge/draft/primary-nudge-digest.js";
import { ScheduledFunnelManifest, newScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

export function summarizePrimaryNudgeDigestsForManifest(items: PrimaryNudgeDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveScheduledFunnelManifestsFromDigest(items: PrimaryNudgeDigest[]): ScheduledFunnelManifest[] {
  const out: ScheduledFunnelManifest[] = [];
  for (const item of items) {
    const derived = newScheduledFunnelManifest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleScheduledFunnelManifest(item: ScheduledFunnelManifest): string {
  return nudgeForecastBucket(item.effectiveTotal());
}
