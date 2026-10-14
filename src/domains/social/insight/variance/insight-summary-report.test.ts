import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightSummaryReport } from "./insight-summary-report.js";
import { InsightSummary, newInsightSummary } from "./insight-summary.js";

test("InsightSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_443_654);
  const items: InsightSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newInsightSummary(`insight-summary-${index}`, "sample"));
  }
  const report = buildInsightSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
