import {
  classifyAdaptiveSuppressionForecast,
} from "../../suppression/segment/adaptive-suppression-forecast-policy.js";
import { GlobalSuppressionRecord } from "../../suppression/segment/global-suppression-record.js";
import { PendingProofAgreement, newPendingProofAgreement } from "./pending-proof-agreement.js";

export function summarizeGlobalSuppressionRecordsForAgreement(items: GlobalSuppressionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function derivePendingProofAgreementsFromRecord(items: GlobalSuppressionRecord[]): PendingProofAgreement[] {
  const out: PendingProofAgreement[] = [];
  for (const item of items) {
    const derived = newPendingProofAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcilePendingProofAgreement(item: PendingProofAgreement): string {
  return classifyAdaptiveSuppressionForecast(item.measuredValue());
}
