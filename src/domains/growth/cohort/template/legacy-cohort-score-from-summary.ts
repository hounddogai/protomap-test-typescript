import { AdaptiveNudgeSummary } from "../../nudge/regional-nudge-window/adaptive-nudge-summary.js";
import { classifyFallbackNudgeEntry } from "../../nudge/regional-nudge-window/fallback-nudge-entry-policy.js";
import { LegacyCohortScore, newLegacyCohortScore } from "./legacy-cohort-score.js";

export function summarizeAdaptiveNudgeSummariesForScore(items: AdaptiveNudgeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyCohortScoresFromSummary(items: AdaptiveNudgeSummary[]): LegacyCohortScore[] {
  const out: LegacyCohortScore[] = [];
  for (const item of items) {
    const derived = newLegacyCohortScore(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeLegacyCohortScore(item: LegacyCohortScore): string {
  return classifyFallbackNudgeEntry(item.projectedVolume());
}
