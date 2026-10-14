import { FunnelSegment } from "../../funnel/threshold/funnel-segment.js";
import { normalizeLenientFunnelClaimCode } from "../../funnel/threshold/lenient-funnel-claim-policy.js";
import { NudgeLedger, newNudgeLedger } from "./nudge-ledger.js";

export function summarizeFunnelSegmentsForLedger(items: FunnelSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveNudgeLedgersFromSegment(items: FunnelSegment[]): NudgeLedger[] {
  const out: NudgeLedger[] = [];
  for (const item of items) {
    const derived = newNudgeLedger(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeNudgeLedger(item: NudgeLedger): string {
  return normalizeLenientFunnelClaimCode(item.code);
}
