import { classifyAdaptiveCsatMilestone } from "../milestone/adaptive-csat-milestone-policy.js";
import { LenientCsatCheckpoint } from "../milestone/lenient-csat-checkpoint.js";
import { SeasonalCsatAudit, newSeasonalCsatAudit } from "./seasonal-csat-audit.js";

export function summarizeLenientCsatCheckpointsForAudit(items: LenientCsatCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSeasonalCsatAuditsFromCheckpoint(items: LenientCsatCheckpoint[]): SeasonalCsatAudit[] {
  const out: SeasonalCsatAudit[] = [];
  for (const item of items) {
    const derived = newSeasonalCsatAudit(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignSeasonalCsatAudit(item: SeasonalCsatAudit): string {
  return classifyAdaptiveCsatMilestone(item.weightedVolume());
}
