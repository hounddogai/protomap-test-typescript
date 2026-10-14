import { bounceManifestBucket } from "../../bounce/record-item/bounce-manifest-policy.js";
import { BounceManifest } from "../../bounce/record-item/bounce-manifest.js";
import { PrimaryDomainMapping, newPrimaryDomainMapping } from "./primary-domain-mapping.js";

export function summarizeBounceManifestsForMapping(items: BounceManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePrimaryDomainMappingsFromManifest(items: BounceManifest[]): PrimaryDomainMapping[] {
  const out: PrimaryDomainMapping[] = [];
  for (const item of items) {
    const derived = newPrimaryDomainMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePrimaryDomainMapping(item: PrimaryDomainMapping): string {
  return bounceManifestBucket(item.effectiveValue());
}
