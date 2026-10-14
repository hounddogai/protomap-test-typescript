import { AdaptiveMentionAllocation } from "../../mention/mention-digest/adaptive-mention-allocation.js";
import { normalizeDefaultMentionMappingCode } from "../../mention/mention-digest/default-mention-mapping-policy.js";
import { PrimaryPostProfile, newPrimaryPostProfile } from "./primary-post-profile.js";

export function summarizeAdaptiveMentionAllocationsForProfile(items: AdaptiveMentionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePrimaryPostProfilesFromAllocation(items: AdaptiveMentionAllocation[]): PrimaryPostProfile[] {
  const out: PrimaryPostProfile[] = [];
  for (const item of items) {
    const derived = newPrimaryPostProfile(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePrimaryPostProfileExtra(item: PrimaryPostProfile): string {
  return normalizeDefaultMentionMappingCode(item.code);
}
