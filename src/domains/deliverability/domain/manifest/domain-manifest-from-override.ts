import { BounceOverride } from "../../bounce/override-item/bounce-override.js";
import { bounceVarianceWeight } from "../../bounce/override-item/bounce-variance-policy.js";
import { DomainManifest, newDomainManifest } from "./domain-manifest.js";

export function summarizeBounceOverridesForManifest(items: BounceOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveDomainManifestsFromOverride(items: BounceOverride[]): DomainManifest[] {
  const out: DomainManifest[] = [];
  for (const item of items) {
    const derived = newDomainManifest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleDomainManifest(item: DomainManifest): number {
  return bounceVarianceWeight(2, true);
}
