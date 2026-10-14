import { primarySlaAgreementBucket } from "../../sla/agreement/primary-sla-agreement-policy.js";
import { PrimarySlaAgreement } from "../../sla/agreement/primary-sla-agreement.js";
import { GlobalDeflectionRecord, newGlobalDeflectionRecord } from "./global-deflection-record.js";

export function summarizePrimarySlaAgreementsForRecord(items: PrimarySlaAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveGlobalDeflectionRecordsFromAgreement(items: PrimarySlaAgreement[]): GlobalDeflectionRecord[] {
  const out: GlobalDeflectionRecord[] = [];
  for (const item of items) {
    const derived = newGlobalDeflectionRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeGlobalDeflectionRecord(item: GlobalDeflectionRecord): string {
  return primarySlaAgreementBucket(item.projectedLoad());
}
