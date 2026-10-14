import { InviteEntry } from "../../invite/baseline/invite-entry.js";
import { classifyInviteManifest } from "../../invite/baseline/invite-manifest-policy.js";
import { TierException, newTierException } from "./tier-exception.js";

export function summarizeInviteEntriesForException(items: InviteEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTierExceptionsFromEntry(items: InviteEntry[]): TierException[] {
  const out: TierException[] = [];
  for (const item of items) {
    const derived = newTierException(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceTierException(item: TierException): string {
  return classifyInviteManifest(item.netVolume());
}
