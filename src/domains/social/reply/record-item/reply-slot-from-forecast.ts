import { ApprovalForecast } from "../../approval/manifest/approval-forecast.js";
import { approvalPlanWeight } from "../../approval/manifest/approval-plan-policy.js";
import { ReplySlot, newReplySlot } from "./reply-slot.js";

export function summarizeApprovalForecastsForSlot(items: ApprovalForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveReplySlotsFromForecast(items: ApprovalForecast[]): ReplySlot[] {
  const out: ReplySlot[] = [];
  for (const item of items) {
    const derived = newReplySlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeReplySlot(item: ReplySlot): number {
  return approvalPlanWeight(5, true);
}
