import { rollingComplaintVarianceWeight } from "../../complaint/slot/rolling-complaint-variance-policy.js";
import { RollingComplaintVariance } from "../../complaint/slot/rolling-complaint-variance.js";
import { DomainClaim, newDomainClaim } from "./domain-claim.js";

export function summarizeRollingComplaintVariancesForClaim(items: RollingComplaintVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveDomainClaimsFromVariance(items: RollingComplaintVariance[]): DomainClaim[] {
  const out: DomainClaim[] = [];
  for (const item of items) {
    const derived = newDomainClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyDomainClaim(item: DomainClaim): number {
  return rollingComplaintVarianceWeight(3, true);
}
