import { ticketViewBundleBucket } from "../../ticket-view/proposal/ticket-view-bundle-policy.js";
import { TicketViewSnapshot } from "../../ticket-view/proposal/ticket-view-snapshot.js";
import { SlaBundle, newSlaBundle } from "./sla-bundle.js";

export function summarizeTicketViewSnapshotsForBundle(items: TicketViewSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSlaBundlesFromSnapshot(items: TicketViewSnapshot[]): SlaBundle[] {
  const out: SlaBundle[] = [];
  for (const item of items) {
    const derived = newSlaBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifySlaBundle(item: SlaBundle): string {
  return ticketViewBundleBucket(item.adjustedVolume());
}
