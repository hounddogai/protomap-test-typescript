import { normalizeLegacyMentionGroupCode } from "../rollup/legacy-mention-group-policy.js";
import { LegacyMentionGroup } from "../rollup/legacy-mention-group.js";
import { CappedMentionPreference, newCappedMentionPreference } from "./capped-mention-preference.js";

export function summarizeLegacyMentionGroupsForPreference(items: LegacyMentionGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveCappedMentionPreferencesFromGroup(items: LegacyMentionGroup[]): CappedMentionPreference[] {
  const out: CappedMentionPreference[] = [];
  for (const item of items) {
    const derived = newCappedMentionPreference(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchCappedMentionPreference(item: CappedMentionPreference): string {
  return normalizeLegacyMentionGroupCode(item.code);
}
