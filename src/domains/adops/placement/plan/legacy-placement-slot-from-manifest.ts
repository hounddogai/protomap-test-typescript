import { normalizeFrequencyManifestCode } from "../../frequency/manifest/frequency-manifest-policy.js";
import { FrequencyManifest } from "../../frequency/manifest/frequency-manifest.js";
import { LegacyPlacementSlot, newLegacyPlacementSlot } from "./legacy-placement-slot.js";

export function summarizeFrequencyManifestsForSlot(items: FrequencyManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyPlacementSlotsFromManifest(items: FrequencyManifest[]): LegacyPlacementSlot[] {
  const out: LegacyPlacementSlot[] = [];
  for (const item of items) {
    const derived = newLegacyPlacementSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateLegacyPlacementSlot(item: LegacyPlacementSlot): string {
  return normalizeFrequencyManifestCode(item.code);
}
