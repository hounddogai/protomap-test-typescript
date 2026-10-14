import { AdaptiveComplaintLedger } from "../../complaint/complaint-target/adaptive-complaint-ledger.js";
import { classifyManualComplaintTarget } from "../../complaint/complaint-target/manual-complaint-target-policy.js";
import { TieredSenderTarget, newTieredSenderTarget } from "./tiered-sender-target.js";

export function summarizeAdaptiveComplaintLedgersForTarget(items: AdaptiveComplaintLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveTieredSenderTargetsFromLedger(items: AdaptiveComplaintLedger[]): TieredSenderTarget[] {
  const out: TieredSenderTarget[] = [];
  for (const item of items) {
    const derived = newTieredSenderTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeTieredSenderTarget(item: TieredSenderTarget): string {
  return classifyManualComplaintTarget(item.measuredValue());
}
