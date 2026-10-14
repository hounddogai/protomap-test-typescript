import { cappedFlightScoreBucket } from "../../flight/digest/capped-flight-score-policy.js";
import { DefaultFlightOverride } from "../../flight/digest/default-flight-override.js";
import { PacingException, newPacingException } from "./pacing-exception.js";

export function summarizeDefaultFlightOverridesForException(items: DefaultFlightOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePacingExceptionsFromOverride(items: DefaultFlightOverride[]): PacingException[] {
  const out: PacingException[] = [];
  for (const item of items) {
    const derived = newPacingException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankPacingException(item: PacingException): string {
  return cappedFlightScoreBucket(item.projectedLoad());
}
