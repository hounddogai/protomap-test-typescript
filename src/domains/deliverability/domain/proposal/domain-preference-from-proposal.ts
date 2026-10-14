import { LenientReputationProposal } from "../../reputation/proposal/lenient-reputation-proposal.js";
import { tieredReputationQuotaWeight } from "../../reputation/proposal/tiered-reputation-quota-policy.js";
import { DomainPreference, newDomainPreference } from "./domain-preference.js";

export function summarizeLenientReputationProposalsForPreference(items: LenientReputationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveDomainPreferencesFromProposal(items: LenientReputationProposal[]): DomainPreference[] {
  const out: DomainPreference[] = [];
  for (const item of items) {
    const derived = newDomainPreference(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignDomainPreference(item: DomainPreference): number {
  return tieredReputationQuotaWeight(7, true);
}
