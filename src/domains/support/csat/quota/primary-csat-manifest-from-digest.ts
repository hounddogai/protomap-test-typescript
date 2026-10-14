import { LegacySlaDigest } from "../../sla/rule/legacy-sla-digest.js";
import { classifyPendingSlaTarget } from "../../sla/rule/pending-sla-target-policy.js";
import { PrimaryCsatManifest, newPrimaryCsatManifest } from "./primary-csat-manifest.js";

export function summarizeLegacySlaDigestsForManifest(items: LegacySlaDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePrimaryCsatManifestsFromDigest(items: LegacySlaDigest[]): PrimaryCsatManifest[] {
  const out: PrimaryCsatManifest[] = [];
  for (const item of items) {
    const derived = newPrimaryCsatManifest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePrimaryCsatManifest(item: PrimaryCsatManifest): string {
  return classifyPendingSlaTarget(item.weightedVolume());
}
