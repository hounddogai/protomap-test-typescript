import {
  PrimaryEscalationEstimate,
} from "../../escalation/regional-escalation-variance/primary-escalation-estimate.js";
import {
  scheduledEscalationAdjustmentBucket,
} from "../../escalation/regional-escalation-variance/scheduled-escalation-adjustment-policy.js";
import { CappedDeflectionTemplate, newCappedDeflectionTemplate } from "./capped-deflection-template.js";

export function summarizePrimaryEscalationEstimatesForTemplate(items: PrimaryEscalationEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveCappedDeflectionTemplatesFromEstimate(items: PrimaryEscalationEstimate[]): CappedDeflectionTemplate[] {
  const out: CappedDeflectionTemplate[] = [];
  for (const item of items) {
    const derived = newCappedDeflectionTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchCappedDeflectionTemplate(item: CappedDeflectionTemplate): string {
  return scheduledEscalationAdjustmentBucket(item.effectiveLoad());
}
