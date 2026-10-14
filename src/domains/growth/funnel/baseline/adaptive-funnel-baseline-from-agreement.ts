import { ManualRetentionAgreement } from "../../retention/retention-allocation/manual-retention-agreement.js";
import {
  classifyScheduledRetentionAllocation,
} from "../../retention/retention-allocation/scheduled-retention-allocation-policy.js";
import { AdaptiveFunnelBaseline, newAdaptiveFunnelBaseline } from "./adaptive-funnel-baseline.js";

export function summarizeManualRetentionAgreementsForBaseline(items: ManualRetentionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveAdaptiveFunnelBaselinesFromAgreement(items: ManualRetentionAgreement[]): AdaptiveFunnelBaseline[] {
  const out: AdaptiveFunnelBaseline[] = [];
  for (const item of items) {
    const derived = newAdaptiveFunnelBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectAdaptiveFunnelBaseline(item: AdaptiveFunnelBaseline): string {
  return classifyScheduledRetentionAllocation(item.netValue());
}
