import { classifyScheduledMentionDigest } from "../../mention/target/scheduled-mention-digest-policy.js";
import { TieredMentionTier } from "../../mention/target/tiered-mention-tier.js";
import { RegionalQueueProfile, newRegionalQueueProfile } from "./regional-queue-profile.js";

export function summarizeTieredMentionTiersForProfile(items: TieredMentionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRegionalQueueProfilesFromTier(items: TieredMentionTier[]): RegionalQueueProfile[] {
  const out: RegionalQueueProfile[] = [];
  for (const item of items) {
    const derived = newRegionalQueueProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planRegionalQueueProfile(item: RegionalQueueProfile): string {
  return classifyScheduledMentionDigest(item.weightedValue());
}
