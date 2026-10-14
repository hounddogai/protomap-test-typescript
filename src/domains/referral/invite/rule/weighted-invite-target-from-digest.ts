import { InviteDigest } from "../digest/invite-digest.js";
import { normalizeTieredInviteScheduleCode } from "../digest/tiered-invite-schedule-policy.js";
import { WeightedInviteTarget, newWeightedInviteTarget } from "./weighted-invite-target.js";

export function summarizeInviteDigestsForTarget(items: InviteDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveWeightedInviteTargetsFromDigest(items: InviteDigest[]): WeightedInviteTarget[] {
  const out: WeightedInviteTarget[] = [];
  for (const item of items) {
    const derived = newWeightedInviteTarget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankWeightedInviteTarget(item: WeightedInviteTarget): string {
  return normalizeTieredInviteScheduleCode(item.code);
}
