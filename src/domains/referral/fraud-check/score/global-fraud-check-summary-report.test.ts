import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalFraudCheckSummaryReport } from "./global-fraud-check-summary-report.js";
import { GlobalFraudCheckSummary, newGlobalFraudCheckSummary } from "./global-fraud-check-summary.js";

test("GlobalFraudCheckSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_133_790);
  const items: GlobalFraudCheckSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newGlobalFraudCheckSummary(`global-fraud-check-summary-${index}`, "sample"));
  }
  const report = buildGlobalFraudCheckSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
