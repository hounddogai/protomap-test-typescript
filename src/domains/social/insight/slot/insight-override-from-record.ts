import { RegionalApprovalRecord } from "../../approval/approval-record/regional-approval-record.js";
import {
  normalizeRegionalApprovalReviewCode,
} from "../../approval/approval-record/regional-approval-review-policy.js";
import { InsightOverride, newInsightOverride } from "./insight-override.js";

export function summarizeRegionalApprovalRecordsForOverride(items: RegionalApprovalRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveInsightOverridesFromRecord(items: RegionalApprovalRecord[]): InsightOverride[] {
  const out: InsightOverride[] = [];
  for (const item of items) {
    const derived = newInsightOverride(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreInsightOverride(item: InsightOverride): string {
  return normalizeRegionalApprovalReviewCode(item.code);
}
