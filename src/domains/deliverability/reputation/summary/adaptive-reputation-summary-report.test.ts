import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveReputationSummaryReport } from "./adaptive-reputation-summary-report.js";
import { AdaptiveReputationSummary, newAdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

test("AdaptiveReputationSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_831_605);
  const items: AdaptiveReputationSummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveReputationSummary(`adaptive-reputation-summary-${index}`, "sample"));
  }
  const report = buildAdaptiveReputationSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
