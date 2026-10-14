import { BatchedPostProfile } from "../../post/notice/batched-post-profile.js";
import { classifyPostNotice } from "../../post/notice/post-notice-policy.js";
import { InsightNotice, newInsightNotice } from "./insight-notice.js";

export function summarizeBatchedPostProfilesForNotice(items: BatchedPostProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveInsightNoticesFromProfile(items: BatchedPostProfile[]): InsightNotice[] {
  const out: InsightNotice[] = [];
  for (const item of items) {
    const derived = newInsightNotice(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchInsightNotice(item: InsightNotice): string {
  return classifyPostNotice(item.netVolume());
}
