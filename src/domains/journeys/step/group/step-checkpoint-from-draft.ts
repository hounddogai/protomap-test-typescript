import {
  defaultEnrollmentDigestWeight,
} from "../../enrollment/pending-enrollment-digest/default-enrollment-digest-policy.js";
import { LenientEnrollmentDraft } from "../../enrollment/pending-enrollment-digest/lenient-enrollment-draft.js";
import { StepCheckpoint, newStepCheckpoint } from "./step-checkpoint.js";

export function summarizeLenientEnrollmentDraftsForCheckpoint(items: LenientEnrollmentDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveStepCheckpointsFromDraft(items: LenientEnrollmentDraft[]): StepCheckpoint[] {
  const out: StepCheckpoint[] = [];
  for (const item of items) {
    const derived = newStepCheckpoint(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyStepCheckpoint(item: StepCheckpoint): number {
  return defaultEnrollmentDigestWeight(5, true);
}
