import { classifyBranchReservation } from "../../branch/snapshot/branch-reservation-policy.js";
import { TieredBranchNotice } from "../../branch/snapshot/tiered-branch-notice.js";
import { SeasonalStepDraft, newSeasonalStepDraft } from "./seasonal-step-draft.js";

export function summarizeTieredBranchNoticesForDraft(items: TieredBranchNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSeasonalStepDraftsFromNotice(items: TieredBranchNotice[]): SeasonalStepDraft[] {
  const out: SeasonalStepDraft[] = [];
  for (const item of items) {
    const derived = newSeasonalStepDraft(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeSeasonalStepDraft(item: SeasonalStepDraft): string {
  return classifyBranchReservation(item.netValue());
}
