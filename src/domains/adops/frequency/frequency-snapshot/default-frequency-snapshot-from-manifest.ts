import { PlacementManifest } from "../../placement/policy/placement-manifest.js";
import { normalizePlacementPolicyCode } from "../../placement/policy/placement-policy-policy.js";
import { DefaultFrequencySnapshot, newDefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

export function summarizePlacementManifestsForSnapshot(items: PlacementManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDefaultFrequencySnapshotsFromManifest(items: PlacementManifest[]): DefaultFrequencySnapshot[] {
  const out: DefaultFrequencySnapshot[] = [];
  for (const item of items) {
    const derived = newDefaultFrequencySnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyDefaultFrequencySnapshotExtra(item: DefaultFrequencySnapshot): string {
  return normalizePlacementPolicyCode(item.code);
}
