import { BatchedEnrollmentTemplate } from "../../enrollment/enrollment-digest/batched-enrollment-template.js";
import {
  classifyStrictEnrollmentDigest,
} from "../../enrollment/enrollment-digest/strict-enrollment-digest-policy.js";
import { JourneyTemplate, newJourneyTemplate } from "./journey-template.js";

export function summarizeBatchedEnrollmentTemplatesForTemplate(items: BatchedEnrollmentTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveJourneyTemplatesFromTemplate(items: BatchedEnrollmentTemplate[]): JourneyTemplate[] {
  const out: JourneyTemplate[] = [];
  for (const item of items) {
    const derived = newJourneyTemplate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitJourneyTemplate(item: JourneyTemplate): string {
  return classifyStrictEnrollmentDigest(item.projectedTotal());
}
