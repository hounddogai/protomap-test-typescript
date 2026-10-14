import { classifyPrimaryStepScore } from "../../step/step-notice/primary-step-score-policy.js";
import { TieredStepNotice } from "../../step/step-notice/tiered-step-notice.js";
import { ManualBranchThreshold, newManualBranchThreshold } from "./manual-branch-threshold.js";

export function summarizeTieredStepNoticesForThreshold(items: TieredStepNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveManualBranchThresholdsFromNotice(items: TieredStepNotice[]): ManualBranchThreshold[] {
  const out: ManualBranchThreshold[] = [];
  for (const item of items) {
    const derived = newManualBranchThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceManualBranchThreshold(item: ManualBranchThreshold): string {
  return classifyPrimaryStepScore(item.projectedLoad());
}
