import { domainPreferenceBucket } from "../../domain/proposal/domain-preference-policy.js";
import { DomainPreference } from "../../domain/proposal/domain-preference.js";
import { ManualReputationProposal, newManualReputationProposal } from "./manual-reputation-proposal.js";

export function summarizeDomainPreferencesForProposal(items: DomainPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualReputationProposalsFromPreference(items: DomainPreference[]): ManualReputationProposal[] {
  const out: ManualReputationProposal[] = [];
  for (const item of items) {
    const derived = newManualReputationProposal(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveManualReputationProposal(item: ManualReputationProposal): string {
  return domainPreferenceBucket(item.effectiveVolume());
}
