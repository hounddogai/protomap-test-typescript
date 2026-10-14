import { replyQuotaBucket } from "../../reply/reply-reservation/reply-quota-policy.js";
import { ReplyThreshold } from "../../reply/reply-reservation/reply-threshold.js";
import { InsightProfile, newInsightProfile } from "./insight-profile.js";

export function summarizeReplyThresholdsForProfile(items: ReplyThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveInsightProfilesFromThreshold(items: ReplyThreshold[]): InsightProfile[] {
  const out: InsightProfile[] = [];
  for (const item of items) {
    const derived = newInsightProfile(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyInsightProfile(item: InsightProfile): string {
  return replyQuotaBucket(item.effectiveValue());
}
