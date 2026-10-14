import {
  normalizeScheduledCohortExceptionCode,
} from "../../cohort/cohort-draft/scheduled-cohort-exception-policy.js";
import { StrictCohortDraft } from "../../cohort/cohort-draft/strict-cohort-draft.js";
import { AdaptiveFunnelTarget, newAdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

export function summarizeStrictCohortDraftsForTarget(items: StrictCohortDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveAdaptiveFunnelTargetsFromDraft(items: StrictCohortDraft[]): AdaptiveFunnelTarget[] {
  const out: AdaptiveFunnelTarget[] = [];
  for (const item of items) {
    const derived = newAdaptiveFunnelTarget(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeAdaptiveFunnelTarget(item: AdaptiveFunnelTarget): string {
  return normalizeScheduledCohortExceptionCode(item.code);
}
