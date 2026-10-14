import { AdaptiveComplaintBundle } from "../../complaint/manifest/adaptive-complaint-bundle.js";
import { defaultComplaintManifestBucket } from "../../complaint/manifest/default-complaint-manifest-policy.js";
import { ScheduledBounceScore, newScheduledBounceScore } from "./scheduled-bounce-score.js";

export function summarizeAdaptiveComplaintBundlesForScore(items: AdaptiveComplaintBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveScheduledBounceScoresFromBundle(items: AdaptiveComplaintBundle[]): ScheduledBounceScore[] {
  const out: ScheduledBounceScore[] = [];
  for (const item of items) {
    const derived = newScheduledBounceScore(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleScheduledBounceScore(item: ScheduledBounceScore): string {
  return defaultComplaintManifestBucket(item.netLoad());
}
