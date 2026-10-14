import { domainPreferenceBucket } from "../../domain/proposal/domain-preference-policy.js";
import { PrimaryDomainProposal } from "../../domain/proposal/primary-domain-proposal.js";
import { TieredBounceAllocation, newTieredBounceAllocation } from "./tiered-bounce-allocation.js";

export function summarizePrimaryDomainProposalsForAllocation(items: PrimaryDomainProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveTieredBounceAllocationsFromProposal(items: PrimaryDomainProposal[]): TieredBounceAllocation[] {
  const out: TieredBounceAllocation[] = [];
  for (const item of items) {
    const derived = newTieredBounceAllocation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankTieredBounceAllocation(item: TieredBounceAllocation): string {
  return domainPreferenceBucket(item.measuredValue());
}
