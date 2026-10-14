import { classifyFunnelMilestone } from "../../funnel/funnel-slot/funnel-milestone-policy.js";
import { ScheduledFunnelRequest } from "../../funnel/funnel-slot/scheduled-funnel-request.js";
import { PrimaryPaywallCycle, newPrimaryPaywallCycle } from "./primary-paywall-cycle.js";

export function summarizeScheduledFunnelRequestsForCycle(items: ScheduledFunnelRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePrimaryPaywallCyclesFromRequest(items: ScheduledFunnelRequest[]): PrimaryPaywallCycle[] {
  const out: PrimaryPaywallCycle[] = [];
  for (const item of items) {
    const derived = newPrimaryPaywallCycle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePrimaryPaywallCycle(item: PrimaryPaywallCycle): string {
  return classifyFunnelMilestone(item.weightedTotal());
}
