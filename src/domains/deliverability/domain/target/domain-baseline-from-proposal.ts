import { normalizeReputationOverrideCode } from "../../reputation/override-item/reputation-override-policy.js";
import { ReputationProposal } from "../../reputation/override-item/reputation-proposal.js";
import { DomainBaseline, newDomainBaseline } from "./domain-baseline.js";

export function summarizeReputationProposalsForBaseline(items: ReputationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveDomainBaselinesFromProposal(items: ReputationProposal[]): DomainBaseline[] {
  const out: DomainBaseline[] = [];
  for (const item of items) {
    const derived = newDomainBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyDomainBaselineExtra(item: DomainBaseline): string {
  return normalizeReputationOverrideCode(item.code);
}
