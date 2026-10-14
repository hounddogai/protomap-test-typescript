import { DefaultBranchLedger } from "../../branch/ledger/default-branch-ledger.js";
import { classifyStrictBranchReview } from "../../branch/ledger/strict-branch-review-policy.js";
import { GlobalJourneyProposal, newGlobalJourneyProposal } from "./global-journey-proposal.js";

export function summarizeDefaultBranchLedgersForProposal(items: DefaultBranchLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveGlobalJourneyProposalsFromLedger(items: DefaultBranchLedger[]): GlobalJourneyProposal[] {
  const out: GlobalJourneyProposal[] = [];
  for (const item of items) {
    const derived = newGlobalJourneyProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyGlobalJourneyProposal(item: GlobalJourneyProposal): string {
  return classifyStrictBranchReview(item.weightedTotal());
}
