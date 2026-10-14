import { normalizeJourneyDigestCode } from "../../journey/cycle/journey-digest-policy.js";
import { PrimaryJourneyProposal } from "../../journey/cycle/primary-journey-proposal.js";
import { EnrollmentAllocation, newEnrollmentAllocation } from "./enrollment-allocation.js";

export function summarizePrimaryJourneyProposalsForAllocation(items: PrimaryJourneyProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveEnrollmentAllocationsFromProposal(items: PrimaryJourneyProposal[]): EnrollmentAllocation[] {
  const out: EnrollmentAllocation[] = [];
  for (const item of items) {
    const derived = newEnrollmentAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyEnrollmentAllocation(item: EnrollmentAllocation): string {
  return normalizeJourneyDigestCode(item.code);
}
