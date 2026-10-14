import { ManualBranchTemplate } from "../branch-template/manual-branch-template.js";
import { normalizeRegionalBranchDraftCode } from "../branch-template/regional-branch-draft-policy.js";
import { StrictBranchAdjustment, newStrictBranchAdjustment } from "./strict-branch-adjustment.js";

export function summarizeManualBranchTemplatesForAdjustment(items: ManualBranchTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveStrictBranchAdjustmentsFromTemplate(items: ManualBranchTemplate[]): StrictBranchAdjustment[] {
  const out: StrictBranchAdjustment[] = [];
  for (const item of items) {
    const derived = newStrictBranchAdjustment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchStrictBranchAdjustment(item: StrictBranchAdjustment): string {
  return normalizeRegionalBranchDraftCode(item.code);
}
