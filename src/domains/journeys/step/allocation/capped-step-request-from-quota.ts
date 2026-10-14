import { waitPlanWeight } from "../../wait/plan/wait-plan-policy.js";
import { WaitQuota } from "../../wait/plan/wait-quota.js";
import { CappedStepRequest, newCappedStepRequest } from "./capped-step-request.js";

export function summarizeWaitQuotasForRequest(items: WaitQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedStepRequestsFromQuota(items: WaitQuota[]): CappedStepRequest[] {
  const out: CappedStepRequest[] = [];
  for (const item of items) {
    const derived = newCappedStepRequest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planCappedStepRequest(item: CappedStepRequest): number {
  return waitPlanWeight(2, true);
}
