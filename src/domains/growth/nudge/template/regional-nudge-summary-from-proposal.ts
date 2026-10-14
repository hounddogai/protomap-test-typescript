import {
  normalizeRegionalActivationProposalCode,
} from "../../activation/draft/regional-activation-proposal-policy.js";
import { RegionalActivationProposal } from "../../activation/draft/regional-activation-proposal.js";
import { RegionalNudgeSummary, newRegionalNudgeSummary } from "./regional-nudge-summary.js";

export function summarizeRegionalActivationProposalsForSummary(items: RegionalActivationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveRegionalNudgeSummariesFromProposal(items: RegionalActivationProposal[]): RegionalNudgeSummary[] {
  const out: RegionalNudgeSummary[] = [];
  for (const item of items) {
    const derived = newRegionalNudgeSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeRegionalNudgeSummary(item: RegionalNudgeSummary): string {
  return normalizeRegionalActivationProposalCode(item.code);
}
