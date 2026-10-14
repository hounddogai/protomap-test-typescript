import {
  classifyLenientApprovalEstimate,
} from "../../approval/approval-snapshot/lenient-approval-estimate-policy.js";
import { SeasonalApprovalAdjustment } from "../../approval/approval-snapshot/seasonal-approval-adjustment.js";
import { TieredPostSchedule, newTieredPostSchedule } from "./tiered-post-schedule.js";

export function summarizeSeasonalApprovalAdjustmentsForSchedule(items: SeasonalApprovalAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveTieredPostSchedulesFromAdjustment(items: SeasonalApprovalAdjustment[]): TieredPostSchedule[] {
  const out: TieredPostSchedule[] = [];
  for (const item of items) {
    const derived = newTieredPostSchedule(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleTieredPostSchedule(item: TieredPostSchedule): string {
  return classifyLenientApprovalEstimate(item.effectiveValue());
}
