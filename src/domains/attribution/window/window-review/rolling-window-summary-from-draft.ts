import { LegacyModelDraft } from "../../model/model-draft/legacy-model-draft.js";
import { classifyRegionalModelGroup } from "../../model/model-draft/regional-model-group-policy.js";
import { RollingWindowSummary, newRollingWindowSummary } from "./rolling-window-summary.js";

export function summarizeLegacyModelDraftsForSummary(items: LegacyModelDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveRollingWindowSummariesFromDraft(items: LegacyModelDraft[]): RollingWindowSummary[] {
  const out: RollingWindowSummary[] = [];
  for (const item of items) {
    const derived = newRollingWindowSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyRollingWindowSummary(item: RollingWindowSummary): string {
  return classifyRegionalModelGroup(item.projectedExposure());
}
