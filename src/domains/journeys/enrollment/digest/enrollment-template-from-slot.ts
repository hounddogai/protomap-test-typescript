import { normalizeStepSlotCode } from "../../step/entry/step-slot-policy.js";
import { StepSlot } from "../../step/entry/step-slot.js";
import { EnrollmentTemplate, newEnrollmentTemplate } from "./enrollment-template.js";

export function summarizeStepSlotsForTemplate(items: StepSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveEnrollmentTemplatesFromSlot(items: StepSlot[]): EnrollmentTemplate[] {
  const out: EnrollmentTemplate[] = [];
  for (const item of items) {
    const derived = newEnrollmentTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveEnrollmentTemplate(item: EnrollmentTemplate): string {
  return normalizeStepSlotCode(item.code);
}
