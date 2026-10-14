import { domainExceptionWeight } from "../../domain/tier/domain-exception-policy.js";
import { DomainException } from "../../domain/tier/domain-exception.js";
import { StrictSenderProposal, newStrictSenderProposal } from "./strict-sender-proposal.js";

export function summarizeDomainExceptionsForProposal(items: DomainException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveStrictSenderProposalsFromException(items: DomainException[]): StrictSenderProposal[] {
  const out: StrictSenderProposal[] = [];
  for (const item of items) {
    const derived = newStrictSenderProposal(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveStrictSenderProposal(item: StrictSenderProposal): number {
  return domainExceptionWeight(5, true);
}
