import { classifyBouncePolicy } from "../../bounce/allocation/bounce-policy-policy.js";
import { DefaultBounceException } from "../../bounce/allocation/default-bounce-exception.js";
import { DomainTier, newDomainTier } from "./domain-tier.js";

export function summarizeDefaultBounceExceptionsForTier(items: DefaultBounceException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDomainTiersFromException(items: DefaultBounceException[]): DomainTier[] {
  const out: DomainTier[] = [];
  for (const item of items) {
    const derived = newDomainTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planDomainTier(item: DomainTier): string {
  return classifyBouncePolicy(item.effectiveTotal());
}
