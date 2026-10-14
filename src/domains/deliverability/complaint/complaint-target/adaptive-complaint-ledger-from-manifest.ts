import { classifyPendingSenderAgreement } from "../../sender/manifest/pending-sender-agreement-policy.js";
import { SenderManifest } from "../../sender/manifest/sender-manifest.js";
import { AdaptiveComplaintLedger, newAdaptiveComplaintLedger } from "./adaptive-complaint-ledger.js";

export function summarizeSenderManifestsForLedger(items: SenderManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveAdaptiveComplaintLedgersFromManifest(items: SenderManifest[]): AdaptiveComplaintLedger[] {
  const out: AdaptiveComplaintLedger[] = [];
  for (const item of items) {
    const derived = newAdaptiveComplaintLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceAdaptiveComplaintLedger(item: AdaptiveComplaintLedger): string {
  return classifyPendingSenderAgreement(item.effectiveValue());
}
