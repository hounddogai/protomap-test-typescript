import { slaTargetWeight } from "../../sla/target/sla-target-policy.js";
import { SlaTarget } from "../../sla/target/sla-target.js";
import { CsatRequest, newCsatRequest } from "./csat-request.js";

export function summarizeSlaTargetsForRequest(items: SlaTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCsatRequestsFromTarget(items: SlaTarget[]): CsatRequest[] {
  const out: CsatRequest[] = [];
  for (const item of items) {
    const derived = newCsatRequest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignCsatRequest(item: CsatRequest): number {
  return slaTargetWeight(4, true);
}
