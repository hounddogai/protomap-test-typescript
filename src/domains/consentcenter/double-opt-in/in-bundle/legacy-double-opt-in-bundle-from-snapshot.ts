import { proofDigestBucket } from "../../proof/record-item/proof-digest-policy.js";
import { ProofSnapshot } from "../../proof/record-item/proof-snapshot.js";
import { LegacyDoubleOptInBundle, newLegacyDoubleOptInBundle } from "./legacy-double-opt-in-bundle.js";

export function summarizeProofSnapshotsForBundle(items: ProofSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveLegacyDoubleOptInBundlesFromSnapshot(items: ProofSnapshot[]): LegacyDoubleOptInBundle[] {
  const out: LegacyDoubleOptInBundle[] = [];
  for (const item of items) {
    const derived = newLegacyDoubleOptInBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeLegacyDoubleOptInBundle(item: LegacyDoubleOptInBundle): string {
  return proofDigestBucket(item.effectiveLoad());
}
