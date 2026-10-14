import { DomainPolicy } from "../../domain/policy/domain-policy.js";
import { rollingDomainSummaryWeight } from "../../domain/policy/rolling-domain-summary-policy.js";
import { RegionalReputationScore, newRegionalReputationScore } from "./regional-reputation-score.js";

export function summarizeDomainPoliciesForScore(items: DomainPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveRegionalReputationScoresFromPolicy(items: DomainPolicy[]): RegionalReputationScore[] {
  const out: RegionalReputationScore[] = [];
  for (const item of items) {
    const derived = newRegionalReputationScore(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignRegionalReputationScore(item: RegionalReputationScore): number {
  return rollingDomainSummaryWeight(5, true);
}
