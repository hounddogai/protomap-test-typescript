import { classifyJourneyAudit } from "../../journey/audit/journey-audit-policy.js";
import { JourneyAudit } from "../../journey/audit/journey-audit.js";
import { StepDigest, newStepDigest } from "./step-digest.js";

export function summarizeJourneyAuditsForDigest(items: JourneyAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveStepDigestsFromAudit(items: JourneyAudit[]): StepDigest[] {
  const out: StepDigest[] = [];
  for (const item of items) {
    const derived = newStepDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreStepDigest(item: StepDigest): string {
  return classifyJourneyAudit(item.adjustedLoad());
}
