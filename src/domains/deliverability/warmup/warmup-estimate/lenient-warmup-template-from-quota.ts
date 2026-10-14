import { senderQuotaBucket } from "../../sender/sender-segment/sender-quota-policy.js";
import { SenderQuota } from "../../sender/sender-segment/sender-quota.js";
import { LenientWarmupTemplate, newLenientWarmupTemplate } from "./lenient-warmup-template.js";

export function summarizeSenderQuotasForTemplate(items: SenderQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientWarmupTemplatesFromQuota(items: SenderQuota[]): LenientWarmupTemplate[] {
  const out: LenientWarmupTemplate[] = [];
  for (const item of items) {
    const derived = newLenientWarmupTemplate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleLenientWarmupTemplate(item: LenientWarmupTemplate): string {
  return senderQuotaBucket(item.measuredValue());
}
