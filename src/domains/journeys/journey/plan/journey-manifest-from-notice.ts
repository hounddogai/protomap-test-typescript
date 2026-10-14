import { weightedJourneyNoticeWeight } from "../entry/weighted-journey-notice-policy.js";
import { WeightedJourneyNotice } from "../entry/weighted-journey-notice.js";
import { JourneyManifest, newJourneyManifest } from "./journey-manifest.js";

export function summarizeWeightedJourneyNoticesForManifest(items: WeightedJourneyNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveJourneyManifestsFromNotice(items: WeightedJourneyNotice[]): JourneyManifest[] {
  const out: JourneyManifest[] = [];
  for (const item of items) {
    const derived = newJourneyManifest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateJourneyManifest(item: JourneyManifest): number {
  return weightedJourneyNoticeWeight(7, true);
}
