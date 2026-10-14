import { ActivationCheckpoint } from "../../activation/batched-activation-allocation/activation-checkpoint.js";
import {
  normalizeLenientActivationBundleCode,
} from "../../activation/batched-activation-allocation/lenient-activation-bundle-policy.js";
import { PaywallSchedule, newPaywallSchedule } from "./paywall-schedule.js";

export function summarizeActivationCheckpointsForSchedule(items: ActivationCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePaywallSchedulesFromCheckpoint(items: ActivationCheckpoint[]): PaywallSchedule[] {
  const out: PaywallSchedule[] = [];
  for (const item of items) {
    const derived = newPaywallSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizePaywallSchedule(item: PaywallSchedule): string {
  return normalizeLenientActivationBundleCode(item.code);
}
