import { CappedTicketViewCheckpoint } from "../../ticket-view/target/capped-ticket-view-checkpoint.js";
import { ticketViewMappingWeight } from "../../ticket-view/target/ticket-view-mapping-policy.js";
import { PrimaryDeflectionCycle, newPrimaryDeflectionCycle } from "./primary-deflection-cycle.js";

export function summarizeCappedTicketViewCheckpointsForCycle(items: CappedTicketViewCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePrimaryDeflectionCyclesFromCheckpoint(items: CappedTicketViewCheckpoint[]): PrimaryDeflectionCycle[] {
  const out: PrimaryDeflectionCycle[] = [];
  for (const item of items) {
    const derived = newPrimaryDeflectionCycle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPrimaryDeflectionCycle(item: PrimaryDeflectionCycle): number {
  return ticketViewMappingWeight(2, true);
}
