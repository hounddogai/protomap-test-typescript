import { normalizeManualTierWindowCode } from "../../tier/window/manual-tier-window-policy.js";
import { TierSlot } from "../../tier/window/tier-slot.js";
import { InviteProposal, newInviteProposal } from "./invite-proposal.js";

export function summarizeTierSlotsForProposal(items: TierSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveInviteProposalsFromSlot(items: TierSlot[]): InviteProposal[] {
  const out: InviteProposal[] = [];
  for (const item of items) {
    const derived = newInviteProposal(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceInviteProposal(item: InviteProposal): string {
  return normalizeManualTierWindowCode(item.code);
}
