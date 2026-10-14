import { SenderBatch } from "../../sender/batch/sender-batch.js";
import { normalizeSenderSummaryCode } from "../../sender/batch/sender-summary-policy.js";
import { DomainTemplate, newDomainTemplate } from "./domain-template.js";

export function summarizeSenderBatchesForTemplate(items: SenderBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDomainTemplatesFromBatch(items: SenderBatch[]): DomainTemplate[] {
  const out: DomainTemplate[] = [];
  for (const item of items) {
    const derived = newDomainTemplate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeDomainTemplate(item: DomainTemplate): string {
  return normalizeSenderSummaryCode(item.code);
}
