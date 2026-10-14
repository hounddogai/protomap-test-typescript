import { DefaultJourneyProposal } from "../../journey/target/default-journey-proposal.js";
import { normalizeGlobalJourneyLedgerCode } from "../../journey/target/global-journey-ledger-policy.js";
import { PrimaryStepScore, newPrimaryStepScore } from "./primary-step-score.js";

export function summarizeDefaultJourneyProposalsForScore(items: DefaultJourneyProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePrimaryStepScoresFromProposal(items: DefaultJourneyProposal[]): PrimaryStepScore[] {
  const out: PrimaryStepScore[] = [];
  for (const item of items) {
    const derived = newPrimaryStepScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scorePrimaryStepScore(item: PrimaryStepScore): string {
  return normalizeGlobalJourneyLedgerCode(item.code);
}
