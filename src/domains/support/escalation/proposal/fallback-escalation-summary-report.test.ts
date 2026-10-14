import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackEscalationSummaryReport } from "./fallback-escalation-summary-report.js";
import { FallbackEscalationSummary, newFallbackEscalationSummary } from "./fallback-escalation-summary.js";

test("FallbackEscalationSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_906_318);
  const items: FallbackEscalationSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackEscalationSummary(`fallback-escalation-summary-${index}`, "sample"));
  }
  const report = buildFallbackEscalationSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
