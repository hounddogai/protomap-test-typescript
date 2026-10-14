import { LegacyReplyDigest } from "../../reply/digest/legacy-reply-digest.js";
import { normalizeScheduledReplyClaimCode } from "../../reply/digest/scheduled-reply-claim-policy.js";
import { RegionalInsightGroup, newRegionalInsightGroup } from "./regional-insight-group.js";

export function summarizeLegacyReplyDigestsForGroup(items: LegacyReplyDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveRegionalInsightGroupsFromDigest(items: LegacyReplyDigest[]): RegionalInsightGroup[] {
  const out: RegionalInsightGroup[] = [];
  for (const item of items) {
    const derived = newRegionalInsightGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignRegionalInsightGroup(item: RegionalInsightGroup): string {
  return normalizeScheduledReplyClaimCode(item.code);
}
