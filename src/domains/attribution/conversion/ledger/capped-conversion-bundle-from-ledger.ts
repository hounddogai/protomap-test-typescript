import { classifyDefaultPathLedger } from "../../path/profile/default-path-ledger-policy.js";
import { DefaultPathLedger } from "../../path/profile/default-path-ledger.js";
import { CappedConversionBundle, newCappedConversionBundle } from "./capped-conversion-bundle.js";

export function summarizeDefaultPathLedgersForBundle(items: DefaultPathLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedConversionBundlesFromLedger(items: DefaultPathLedger[]): CappedConversionBundle[] {
  const out: CappedConversionBundle[] = [];
  for (const item of items) {
    const derived = newCappedConversionBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCappedConversionBundle(item: CappedConversionBundle): string {
  return classifyDefaultPathLedger(item.projectedLoad());
}
