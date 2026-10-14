import { complaintMappingWeight } from "../../complaint/mapping/complaint-mapping-policy.js";
import { ComplaintWindow } from "../../complaint/mapping/complaint-window.js";
import { SenderPlan, newSenderPlan } from "./sender-plan.js";

export function summarizeComplaintWindowsForPlan(items: ComplaintWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveSenderPlansFromWindow(items: ComplaintWindow[]): SenderPlan[] {
  const out: SenderPlan[] = [];
  for (const item of items) {
    const derived = newSenderPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeSenderPlan(item: SenderPlan): number {
  return complaintMappingWeight(4, true);
}
