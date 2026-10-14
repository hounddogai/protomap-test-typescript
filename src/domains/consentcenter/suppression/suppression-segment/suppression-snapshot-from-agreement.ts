import { normalizeGlobalSuppressionAgreementCode } from "../group/global-suppression-agreement-policy.js";
import { GlobalSuppressionAgreement } from "../group/global-suppression-agreement.js";
import { SuppressionSnapshot, newSuppressionSnapshot } from "./suppression-snapshot.js";

export function summarizeGlobalSuppressionAgreementsForSnapshot(items: GlobalSuppressionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveSuppressionSnapshotsFromAgreement(items: GlobalSuppressionAgreement[]): SuppressionSnapshot[] {
  const out: SuppressionSnapshot[] = [];
  for (const item of items) {
    const derived = newSuppressionSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planSuppressionSnapshot(item: SuppressionSnapshot): string {
  return normalizeGlobalSuppressionAgreementCode(item.code);
}
