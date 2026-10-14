import { classifyComplaintCycle } from "../../complaint/cycle/complaint-cycle-policy.js";
import { ComplaintException } from "../../complaint/cycle/complaint-exception.js";
import { AdaptiveReputationSummary, newAdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

export function summarizeComplaintExceptionsForSummary(items: ComplaintException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveAdaptiveReputationSummariesFromException(items: ComplaintException[]): AdaptiveReputationSummary[] {
  const out: AdaptiveReputationSummary[] = [];
  for (const item of items) {
    const derived = newAdaptiveReputationSummary(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchAdaptiveReputationSummary(item: AdaptiveReputationSummary): string {
  return classifyComplaintCycle(item.projectedLoad());
}
