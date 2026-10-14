import { JourneyAgreement } from "../audit/journey-agreement.js";
import { classifyJourneyAudit } from "../audit/journey-audit-policy.js";
import { PrimaryJourneyProposal, newPrimaryJourneyProposal } from "./primary-journey-proposal.js";

export function summarizeJourneyAgreementsForProposal(items: JourneyAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePrimaryJourneyProposalsFromAgreement(items: JourneyAgreement[]): PrimaryJourneyProposal[] {
  const out: PrimaryJourneyProposal[] = [];
  for (const item of items) {
    const derived = newPrimaryJourneyProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePrimaryJourneyProposal(item: PrimaryJourneyProposal): string {
  return classifyJourneyAudit(item.weightedValue());
}
