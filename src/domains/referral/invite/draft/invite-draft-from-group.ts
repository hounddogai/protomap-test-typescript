import { BatchedTierGroup } from "../../tier/budget/batched-tier-group.js";
import { classifyTierBudget } from "../../tier/budget/tier-budget-policy.js";
import { InviteDraft, newInviteDraft } from "./invite-draft.js";

export function summarizeBatchedTierGroupsForDraft(items: BatchedTierGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveInviteDraftsFromGroup(items: BatchedTierGroup[]): InviteDraft[] {
  const out: InviteDraft[] = [];
  for (const item of items) {
    const derived = newInviteDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyInviteDraftExtra(item: InviteDraft): string {
  return classifyTierBudget(item.measuredValue());
}
