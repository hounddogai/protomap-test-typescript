import { classifyDefaultPaywallCheckpoint } from "../../paywall/rule/default-paywall-checkpoint-policy.js";
import { DefaultPaywallCheckpoint } from "../../paywall/rule/default-paywall-checkpoint.js";
import { ManualRetentionAgreement, newManualRetentionAgreement } from "./manual-retention-agreement.js";

export function summarizeDefaultPaywallCheckpointsForAgreement(items: DefaultPaywallCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualRetentionAgreementsFromCheckpoint(items: DefaultPaywallCheckpoint[]): ManualRetentionAgreement[] {
  const out: ManualRetentionAgreement[] = [];
  for (const item of items) {
    const derived = newManualRetentionAgreement(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeManualRetentionAgreement(item: ManualRetentionAgreement): string {
  return classifyDefaultPaywallCheckpoint(item.projectedExposure());
}
