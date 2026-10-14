import { BounceTarget } from "../../bounce/bounce-reservation/bounce-target.js";
import { manualBounceNoticeWeight } from "../../bounce/bounce-reservation/manual-bounce-notice-policy.js";
import { RollingDomainVariance, newRollingDomainVariance } from "./rolling-domain-variance.js";

export function summarizeBounceTargetsForVariance(items: BounceTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRollingDomainVariancesFromTarget(items: BounceTarget[]): RollingDomainVariance[] {
  const out: RollingDomainVariance[] = [];
  for (const item of items) {
    const derived = newRollingDomainVariance(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeRollingDomainVariance(item: RollingDomainVariance): number {
  return manualBounceNoticeWeight(8, true);
}
