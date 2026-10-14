import { classifyStrictMentionTier } from "../../mention/global-mention-cycle/strict-mention-tier-policy.js";
import { StrictMentionTier } from "../../mention/global-mention-cycle/strict-mention-tier.js";
import { LegacyQueuePolicy, newLegacyQueuePolicy } from "./legacy-queue-policy.js";

export function summarizeStrictMentionTiersForPolicy(items: StrictMentionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveLegacyQueuePoliciesFromTier(items: StrictMentionTier[]): LegacyQueuePolicy[] {
  const out: LegacyQueuePolicy[] = [];
  for (const item of items) {
    const derived = newLegacyQueuePolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectLegacyQueuePolicy(item: LegacyQueuePolicy): string {
  return classifyStrictMentionTier(item.weightedTotal());
}
