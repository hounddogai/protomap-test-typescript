import { primaryPlacementTierBucket } from "../../placement/group/primary-placement-tier-policy.js";
import { PrimaryPlacementTier } from "../../placement/group/primary-placement-tier.js";
import { FlightManifest, newFlightManifest } from "./flight-manifest.js";

export function summarizePrimaryPlacementTiersForManifest(items: PrimaryPlacementTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFlightManifestsFromTier(items: PrimaryPlacementTier[]): FlightManifest[] {
  const out: FlightManifest[] = [];
  for (const item of items) {
    const derived = newFlightManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFlightManifest(item: FlightManifest): string {
  return primaryPlacementTierBucket(item.effectiveVolume());
}
