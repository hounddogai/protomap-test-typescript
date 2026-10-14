import { classifyBatchedInviteEntry } from "../invite-entry/batched-invite-entry-policy.js";
import { TieredInviteSlot } from "../invite-entry/tiered-invite-slot.js";
import { RegionalInviteTarget, newRegionalInviteTarget } from "./regional-invite-target.js";

export function summarizeTieredInviteSlotsForTarget(items: TieredInviteSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRegionalInviteTargetsFromSlot(items: TieredInviteSlot[]): RegionalInviteTarget[] {
  const out: RegionalInviteTarget[] = [];
  for (const item of items) {
    const derived = newRegionalInviteTarget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyRegionalInviteTarget(item: RegionalInviteTarget): string {
  return classifyBatchedInviteEntry(item.projectedExposure());
}
