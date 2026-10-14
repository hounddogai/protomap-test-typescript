import { normalizeDefaultInsightAuditCode } from "../../insight/metric/default-insight-audit-policy.js";
import { InsightLedger } from "../../insight/metric/insight-ledger.js";
import { MentionAdjustment, newMentionAdjustment } from "./mention-adjustment.js";

export function summarizeInsightLedgersForAdjustment(items: InsightLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveMentionAdjustmentsFromLedger(items: InsightLedger[]): MentionAdjustment[] {
  const out: MentionAdjustment[] = [];
  for (const item of items) {
    const derived = newMentionAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveMentionAdjustment(item: MentionAdjustment): string {
  return normalizeDefaultInsightAuditCode(item.code);
}
