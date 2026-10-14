import { domainPolicyBucket } from "../policy/domain-policy-policy.js";
import { DomainPolicy } from "../policy/domain-policy.js";
import { TieredDomainThreshold, newTieredDomainThreshold } from "./tiered-domain-threshold.js";

export function summarizeDomainPoliciesForThreshold(items: DomainPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveTieredDomainThresholdsFromPolicy(items: DomainPolicy[]): TieredDomainThreshold[] {
  const out: TieredDomainThreshold[] = [];
  for (const item of items) {
    const derived = newTieredDomainThreshold(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeTieredDomainThreshold(item: TieredDomainThreshold): string {
  return domainPolicyBucket(item.effectiveTotal());
}
