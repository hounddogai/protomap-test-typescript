import { normalizeTierEntryCode } from "../../tier/entry/tier-entry-policy.js";
import { TierMilestone } from "../../tier/entry/tier-milestone.js";
import { InviteMilestone, newInviteMilestone } from "./invite-milestone.js";

export function summarizeTierMilestonesForMilestone(items: TierMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveInviteMilestonesFromMilestone(items: TierMilestone[]): InviteMilestone[] {
  const out: InviteMilestone[] = [];
  for (const item of items) {
    const derived = newInviteMilestone(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankInviteMilestone(item: InviteMilestone): string {
  return normalizeTierEntryCode(item.code);
}
