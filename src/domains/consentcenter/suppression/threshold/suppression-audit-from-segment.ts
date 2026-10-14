import { doubleOptInRuleBucket } from "../../double-opt-in/reservation/double-opt-in-rule-policy.js";
import { DoubleOptInSegment } from "../../double-opt-in/reservation/double-opt-in-segment.js";
import { SuppressionAudit, newSuppressionAudit } from "./suppression-audit.js";

export function summarizeDoubleOptInSegmentsForAudit(items: DoubleOptInSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveSuppressionAuditsFromSegment(items: DoubleOptInSegment[]): SuppressionAudit[] {
  const out: SuppressionAudit[] = [];
  for (const item of items) {
    const derived = newSuppressionAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSuppressionAudit(item: SuppressionAudit): string {
  return doubleOptInRuleBucket(item.adjustedValue());
}
