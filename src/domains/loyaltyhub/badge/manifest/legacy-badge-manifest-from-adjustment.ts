import { classifyCappedLevelAdjustment } from "../../level/level-profile/capped-level-adjustment-policy.js";
import { DefaultLevelAdjustment } from "../../level/level-profile/default-level-adjustment.js";
import { LegacyBadgeManifest, newLegacyBadgeManifest } from "./legacy-badge-manifest.js";

export function summarizeDefaultLevelAdjustmentsForManifest(items: DefaultLevelAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveLegacyBadgeManifestsFromAdjustment(items: DefaultLevelAdjustment[]): LegacyBadgeManifest[] {
  const out: LegacyBadgeManifest[] = [];
  for (const item of items) {
    const derived = newLegacyBadgeManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLegacyBadgeManifest(item: LegacyBadgeManifest): string {
  return classifyCappedLevelAdjustment(item.effectiveExposure());
}
