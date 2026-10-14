import { InviteBundle } from "../../invite/bundle/invite-bundle.js";
import { normalizeInviteMetricCode } from "../../invite/bundle/invite-metric-policy.js";
import { TierEntry, newTierEntry } from "./tier-entry.js";

export function summarizeInviteBundlesForEntry(items: InviteBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveTierEntriesFromBundle(items: InviteBundle[]): TierEntry[] {
  const out: TierEntry[] = [];
  for (const item of items) {
    const derived = newTierEntry(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateTierEntry(item: TierEntry): string {
  return normalizeInviteMetricCode(item.code);
}
