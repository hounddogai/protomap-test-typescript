import {
  defaultComplaintBatchWeight,
} from "../../complaint/tiered-complaint-mapping/default-complaint-batch-policy.js";
import { StrictComplaintMapping } from "../../complaint/tiered-complaint-mapping/strict-complaint-mapping.js";
import { TieredBounceSummary, newTieredBounceSummary } from "./tiered-bounce-summary.js";

export function summarizeStrictComplaintMappingsForSummary(items: StrictComplaintMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveTieredBounceSummariesFromMapping(items: StrictComplaintMapping[]): TieredBounceSummary[] {
  const out: TieredBounceSummary[] = [];
  for (const item of items) {
    const derived = newTieredBounceSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveTieredBounceSummary(item: TieredBounceSummary): number {
  return defaultComplaintBatchWeight(7, true);
}
