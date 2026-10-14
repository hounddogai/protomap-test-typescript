import { classifyLenientSenderDigest } from "../../sender/sender-bundle/lenient-sender-digest-policy.js";
import { LenientSenderDigest } from "../../sender/sender-bundle/lenient-sender-digest.js";
import { AdaptiveDomainSnapshot, newAdaptiveDomainSnapshot } from "./adaptive-domain-snapshot.js";

export function summarizeLenientSenderDigestsForSnapshot(items: LenientSenderDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveAdaptiveDomainSnapshotsFromDigest(items: LenientSenderDigest[]): AdaptiveDomainSnapshot[] {
  const out: AdaptiveDomainSnapshot[] = [];
  for (const item of items) {
    const derived = newAdaptiveDomainSnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planAdaptiveDomainSnapshot(item: AdaptiveDomainSnapshot): string {
  return classifyLenientSenderDigest(item.weightedVolume());
}
