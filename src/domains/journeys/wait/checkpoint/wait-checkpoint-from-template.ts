import {
  batchedEnrollmentTemplateWeight,
} from "../../enrollment/enrollment-digest/batched-enrollment-template-policy.js";
import { BatchedEnrollmentTemplate } from "../../enrollment/enrollment-digest/batched-enrollment-template.js";
import { WaitCheckpoint, newWaitCheckpoint } from "./wait-checkpoint.js";

export function summarizeBatchedEnrollmentTemplatesForCheckpoint(items: BatchedEnrollmentTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWaitCheckpointsFromTemplate(items: BatchedEnrollmentTemplate[]): WaitCheckpoint[] {
  const out: WaitCheckpoint[] = [];
  for (const item of items) {
    const derived = newWaitCheckpoint(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyWaitCheckpoint(item: WaitCheckpoint): number {
  return batchedEnrollmentTemplateWeight(3, true);
}
