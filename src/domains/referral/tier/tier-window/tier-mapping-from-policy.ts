import {
  normalizePendingInvitePolicyCode,
} from "../../invite/scheduled-invite-entry/pending-invite-policy-policy.js";
import { PendingInvitePolicy } from "../../invite/scheduled-invite-entry/pending-invite-policy.js";
import { TierMapping, newTierMapping } from "./tier-mapping.js";

export function summarizePendingInvitePoliciesForMapping(items: PendingInvitePolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveTierMappingsFromPolicy(items: PendingInvitePolicy[]): TierMapping[] {
  const out: TierMapping[] = [];
  for (const item of items) {
    const derived = newTierMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignTierMapping(item: TierMapping): string {
  return normalizePendingInvitePolicyCode(item.code);
}
