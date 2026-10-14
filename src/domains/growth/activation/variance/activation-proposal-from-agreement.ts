import { CohortAgreement } from "../../cohort/quota/cohort-agreement.js";
import { cohortExceptionBucket } from "../../cohort/quota/cohort-exception-policy.js";
import { ActivationProposal, newActivationProposal } from "./activation-proposal.js";

export function summarizeCohortAgreementsForProposal(items: CohortAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveActivationProposalsFromAgreement(items: CohortAgreement[]): ActivationProposal[] {
  const out: ActivationProposal[] = [];
  for (const item of items) {
    const derived = newActivationProposal(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitActivationProposal(item: ActivationProposal): string {
  return cohortExceptionBucket(item.netTotal());
}
