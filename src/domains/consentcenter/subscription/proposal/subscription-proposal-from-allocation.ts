import { batchedOptOutPlanWeight } from "../../opt-out/plan/batched-opt-out-plan-policy.js";
import { DefaultOptOutAllocation } from "../../opt-out/plan/default-opt-out-allocation.js";
import { SubscriptionProposal, newSubscriptionProposal } from "./subscription-proposal.js";

export function summarizeDefaultOptOutAllocationsForProposal(items: DefaultOptOutAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveSubscriptionProposalsFromAllocation(items: DefaultOptOutAllocation[]): SubscriptionProposal[] {
  const out: SubscriptionProposal[] = [];
  for (const item of items) {
    const derived = newSubscriptionProposal(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateSubscriptionProposalExtra(item: SubscriptionProposal): number {
  return batchedOptOutPlanWeight(3, true);
}
