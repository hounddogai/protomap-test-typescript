import {
  globalCreativeForecastBucket,
} from "../../creative/global-creative-forecast/global-creative-forecast-policy.js";
import { LegacyCreativeSegment } from "../../creative/global-creative-forecast/legacy-creative-segment.js";
import { GlobalPacingAudit, newGlobalPacingAudit } from "./global-pacing-audit.js";

export function summarizeLegacyCreativeSegmentsForAudit(items: LegacyCreativeSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveGlobalPacingAuditsFromSegment(items: LegacyCreativeSegment[]): GlobalPacingAudit[] {
  const out: GlobalPacingAudit[] = [];
  for (const item of items) {
    const derived = newGlobalPacingAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchGlobalPacingAudit(item: GlobalPacingAudit): string {
  return globalCreativeForecastBucket(item.measuredValue());
}
