import { ScheduledWaitRequest } from "../request/scheduled-wait-request.js";
import { classifyWaitClaim } from "../request/wait-claim-policy.js";
import { WaitTemplate, newWaitTemplate } from "./wait-template.js";

export function summarizeScheduledWaitRequestsForTemplate(items: ScheduledWaitRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveWaitTemplatesFromRequest(items: ScheduledWaitRequest[]): WaitTemplate[] {
  const out: WaitTemplate[] = [];
  for (const item of items) {
    const derived = newWaitTemplate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignWaitTemplate(item: WaitTemplate): string {
  return classifyWaitClaim(item.measuredValue());
}
