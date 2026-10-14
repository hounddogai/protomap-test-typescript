import { lenientWarmupRecordBucket } from "../../warmup/notice/lenient-warmup-record-policy.js";
import { PendingWarmupReservation } from "../../warmup/notice/pending-warmup-reservation.js";
import { LenientDomainTemplate, newLenientDomainTemplate } from "./lenient-domain-template.js";

export function summarizePendingWarmupReservationsForTemplate(items: PendingWarmupReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveLenientDomainTemplatesFromReservation(items: PendingWarmupReservation[]): LenientDomainTemplate[] {
  const out: LenientDomainTemplate[] = [];
  for (const item of items) {
    const derived = newLenientDomainTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeLenientDomainTemplate(item: LenientDomainTemplate): string {
  return lenientWarmupRecordBucket(item.effectiveVolume());
}
