import { lenientReplyBatchWeight } from "../../reply/reply-template/lenient-reply-batch-policy.js";
import { WeightedReplyTemplate } from "../../reply/reply-template/weighted-reply-template.js";
import { PrimaryInsightLedger, newPrimaryInsightLedger } from "./primary-insight-ledger.js";

export function summarizeWeightedReplyTemplatesForLedger(items: WeightedReplyTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryInsightLedgersFromTemplate(items: WeightedReplyTemplate[]): PrimaryInsightLedger[] {
  const out: PrimaryInsightLedger[] = [];
  for (const item of items) {
    const derived = newPrimaryInsightLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankPrimaryInsightLedger(item: PrimaryInsightLedger): number {
  return lenientReplyBatchWeight(4, true);
}
