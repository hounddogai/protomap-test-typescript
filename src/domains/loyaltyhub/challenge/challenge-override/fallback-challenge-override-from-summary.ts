import { classifyBadgeAudit } from "../../badge/digest/badge-audit-policy.js";
import { BadgeSummary } from "../../badge/digest/badge-summary.js";
import { FallbackChallengeOverride, newFallbackChallengeOverride } from "./fallback-challenge-override.js";

export function summarizeBadgeSummariesForOverride(items: BadgeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveFallbackChallengeOverridesFromSummary(items: BadgeSummary[]): FallbackChallengeOverride[] {
  const out: FallbackChallengeOverride[] = [];
  for (const item of items) {
    const derived = newFallbackChallengeOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankFallbackChallengeOverride(item: FallbackChallengeOverride): string {
  return classifyBadgeAudit(item.measuredValue());
}
