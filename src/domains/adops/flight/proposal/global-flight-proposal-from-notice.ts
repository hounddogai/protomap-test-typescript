import { batchedPlacementBudgetBucket } from "../../placement/checkpoint/batched-placement-budget-policy.js";
import { PlacementNotice } from "../../placement/checkpoint/placement-notice.js";
import { GlobalFlightProposal, newGlobalFlightProposal } from "./global-flight-proposal.js";

export function summarizePlacementNoticesForProposal(items: PlacementNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveGlobalFlightProposalsFromNotice(items: PlacementNotice[]): GlobalFlightProposal[] {
  const out: GlobalFlightProposal[] = [];
  for (const item of items) {
    const derived = newGlobalFlightProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyGlobalFlightProposalExtra(item: GlobalFlightProposal): string {
  return batchedPlacementBudgetBucket(item.measuredValue());
}
