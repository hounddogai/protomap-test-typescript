import { OptOutSnapshot } from "../../opt-out/entry/opt-out-snapshot.js";
import { normalizePrimaryOptOutMetricCode } from "../../opt-out/entry/primary-opt-out-metric-policy.js";
import { CappedDoubleOptInAgreement, newCappedDoubleOptInAgreement } from "./capped-double-opt-in-agreement.js";

export function summarizeOptOutSnapshotsForAgreement(items: OptOutSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedDoubleOptInAgreementsFromSnapshot(items: OptOutSnapshot[]): CappedDoubleOptInAgreement[] {
  const out: CappedDoubleOptInAgreement[] = [];
  for (const item of items) {
    const derived = newCappedDoubleOptInAgreement(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignCappedDoubleOptInAgreement(item: CappedDoubleOptInAgreement): string {
  return normalizePrimaryOptOutMetricCode(item.code);
}
