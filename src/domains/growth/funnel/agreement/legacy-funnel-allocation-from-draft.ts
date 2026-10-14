import { RollingCohortDraft } from "../../cohort/score/rolling-cohort-draft.js";
import { classifySeasonalCohortProposal } from "../../cohort/score/seasonal-cohort-proposal-policy.js";
import { LegacyFunnelAllocation, newLegacyFunnelAllocation } from "./legacy-funnel-allocation.js";

export function summarizeRollingCohortDraftsForAllocation(items: RollingCohortDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveLegacyFunnelAllocationsFromDraft(items: RollingCohortDraft[]): LegacyFunnelAllocation[] {
  const out: LegacyFunnelAllocation[] = [];
  for (const item of items) {
    const derived = newLegacyFunnelAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeLegacyFunnelAllocation(item: LegacyFunnelAllocation): string {
  return classifySeasonalCohortProposal(item.projectedTotal());
}
