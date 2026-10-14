import { insightRuleBucket } from "../../insight/variance/insight-rule-policy.js";
import { InsightVariance } from "../../insight/variance/insight-variance.js";
import { MentionProfile, newMentionProfile } from "./mention-profile.js";

export function summarizeInsightVariancesForProfile(items: InsightVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveMentionProfilesFromVariance(items: InsightVariance[]): MentionProfile[] {
  const out: MentionProfile[] = [];
  for (const item of items) {
    const derived = newMentionProfile(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeMentionProfile(item: MentionProfile): string {
  return insightRuleBucket(item.netLoad());
}
