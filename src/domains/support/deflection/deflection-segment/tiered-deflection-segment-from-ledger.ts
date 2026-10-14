import {
  classifyAdaptiveTicketViewLedger,
} from "../../ticket-view/view-summary/adaptive-ticket-view-ledger-policy.js";
import { AdaptiveTicketViewLedger } from "../../ticket-view/view-summary/adaptive-ticket-view-ledger.js";
import { TieredDeflectionSegment, newTieredDeflectionSegment } from "./tiered-deflection-segment.js";

export function summarizeAdaptiveTicketViewLedgersForSegment(items: AdaptiveTicketViewLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveTieredDeflectionSegmentsFromLedger(items: AdaptiveTicketViewLedger[]): TieredDeflectionSegment[] {
  const out: TieredDeflectionSegment[] = [];
  for (const item of items) {
    const derived = newTieredDeflectionSegment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeTieredDeflectionSegment(item: TieredDeflectionSegment): string {
  return classifyAdaptiveTicketViewLedger(item.netVolume());
}
