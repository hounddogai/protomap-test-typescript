import { normalizeLegacyQueueEstimateCode } from "../../queue/estimate/legacy-queue-estimate-policy.js";
import { LegacyQueueEstimate } from "../../queue/estimate/legacy-queue-estimate.js";
import { PostSummary, newPostSummary } from "./post-summary.js";

export function summarizeLegacyQueueEstimatesForSummary(items: LegacyQueueEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function derivePostSummariesFromEstimate(items: LegacyQueueEstimate[]): PostSummary[] {
  const out: PostSummary[] = [];
  for (const item of items) {
    const derived = newPostSummary(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizePostSummary(item: PostSummary): string {
  return normalizeLegacyQueueEstimateCode(item.code);
}
