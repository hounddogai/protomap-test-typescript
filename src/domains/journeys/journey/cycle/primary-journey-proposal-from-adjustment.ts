import { BranchAdjustment } from "../../branch/review/branch-adjustment.js";
import { normalizeRegionalBranchDigestCode } from "../../branch/review/regional-branch-digest-policy.js";
import { PrimaryJourneyProposal, newPrimaryJourneyProposal } from "./primary-journey-proposal.js";

export function summarizeBranchAdjustmentsForProposal(items: BranchAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryJourneyProposalsFromAdjustment(items: BranchAdjustment[]): PrimaryJourneyProposal[] {
  const out: PrimaryJourneyProposal[] = [];
  for (const item of items) {
    const derived = newPrimaryJourneyProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computePrimaryJourneyProposal(item: PrimaryJourneyProposal): string {
  return normalizeRegionalBranchDigestCode(item.code);
}
