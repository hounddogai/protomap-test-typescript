import { WeightedDoubleOptInDigest } from "../../double-opt-in/plan/weighted-double-opt-in-digest.js";
import {
  weightedDoubleOptInManifestWeight,
} from "../../double-opt-in/plan/weighted-double-opt-in-manifest-policy.js";
import { StrictPreferenceManifest, newStrictPreferenceManifest } from "./strict-preference-manifest.js";

export function summarizeWeightedDoubleOptInDigestsForManifest(items: WeightedDoubleOptInDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveStrictPreferenceManifestsFromDigest(items: WeightedDoubleOptInDigest[]): StrictPreferenceManifest[] {
  const out: StrictPreferenceManifest[] = [];
  for (const item of items) {
    const derived = newStrictPreferenceManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreStrictPreferenceManifest(item: StrictPreferenceManifest): number {
  return weightedDoubleOptInManifestWeight(9, true);
}
