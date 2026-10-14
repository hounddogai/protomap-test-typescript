import { classifyFallbackInsightCycle } from "../draft/fallback-insight-cycle-policy.js";
import { TieredInsightAssignment } from "../draft/tiered-insight-assignment.js";
import { InsightPreference, newInsightPreference } from "./insight-preference.js";

export function summarizeTieredInsightAssignmentsForPreference(items: TieredInsightAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveInsightPreferencesFromAssignment(items: TieredInsightAssignment[]): InsightPreference[] {
  const out: InsightPreference[] = [];
  for (const item of items) {
    const derived = newInsightPreference(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectInsightPreference(item: InsightPreference): string {
  return classifyFallbackInsightCycle(item.effectiveExposure());
}
