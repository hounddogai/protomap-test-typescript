import { MacroAgreement } from "../../macro/agreement/macro-agreement.js";
import { macroEntryBucket } from "../../macro/agreement/macro-entry-policy.js";
import { PendingCsatDigest, newPendingCsatDigest } from "./pending-csat-digest.js";

export function summarizeMacroAgreementsForDigest(items: MacroAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingCsatDigestsFromAgreement(items: MacroAgreement[]): PendingCsatDigest[] {
  const out: PendingCsatDigest[] = [];
  for (const item of items) {
    const derived = newPendingCsatDigest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergePendingCsatDigest(item: PendingCsatDigest): string {
  return macroEntryBucket(item.projectedExposure());
}
