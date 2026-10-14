import { InsightAssignment } from "../../insight/threshold/insight-assignment.js";
import { primaryInsightReservationWeight } from "../../insight/threshold/primary-insight-reservation-policy.js";
import { FallbackMentionAdjustment, newFallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

export function summarizeInsightAssignmentsForAdjustment(items: InsightAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveFallbackMentionAdjustmentsFromAssignment(items: InsightAssignment[]): FallbackMentionAdjustment[] {
  const out: FallbackMentionAdjustment[] = [];
  for (const item of items) {
    const derived = newFallbackMentionAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeFallbackMentionAdjustment(item: FallbackMentionAdjustment): number {
  return primaryInsightReservationWeight(1, true);
}
