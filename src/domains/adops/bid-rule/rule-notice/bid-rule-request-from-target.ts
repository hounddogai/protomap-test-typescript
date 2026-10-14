import { classifyDefaultPacingTarget } from "../../pacing/forecast/default-pacing-target-policy.js";
import { DefaultPacingTarget } from "../../pacing/forecast/default-pacing-target.js";
import { BidRuleRequest, newBidRuleRequest } from "./bid-rule-request.js";

export function summarizeDefaultPacingTargetsForRequest(items: DefaultPacingTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveBidRuleRequestsFromTarget(items: DefaultPacingTarget[]): BidRuleRequest[] {
  const out: BidRuleRequest[] = [];
  for (const item of items) {
    const derived = newBidRuleRequest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeBidRuleRequest(item: BidRuleRequest): string {
  return classifyDefaultPacingTarget(item.weightedLoad());
}
