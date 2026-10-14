import { pathBudgetWeight } from "../../path/estimate/path-budget-policy.js";
import { PathProposal } from "../../path/estimate/path-proposal.js";
import { CreditMapping, newCreditMapping } from "./credit-mapping.js";

export function summarizePathProposalsForMapping(items: PathProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreditMappingsFromProposal(items: PathProposal[]): CreditMapping[] {
  const out: CreditMapping[] = [];
  for (const item of items) {
    const derived = newCreditMapping(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateCreditMapping(item: CreditMapping): number {
  return pathBudgetWeight(2, true);
}
