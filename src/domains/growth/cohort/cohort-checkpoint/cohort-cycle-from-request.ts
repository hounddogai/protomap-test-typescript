import { classifyCappedFunnelException } from "../../funnel/lenient-funnel-request/capped-funnel-exception-policy.js";
import { DefaultFunnelRequest } from "../../funnel/lenient-funnel-request/default-funnel-request.js";
import { CohortCycle, newCohortCycle } from "./cohort-cycle.js";

export function summarizeDefaultFunnelRequestsForCycle(items: DefaultFunnelRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveCohortCyclesFromRequest(items: DefaultFunnelRequest[]): CohortCycle[] {
  const out: CohortCycle[] = [];
  for (const item of items) {
    const derived = newCohortCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileCohortCycle(item: CohortCycle): string {
  return classifyCappedFunnelException(item.measuredValue());
}
