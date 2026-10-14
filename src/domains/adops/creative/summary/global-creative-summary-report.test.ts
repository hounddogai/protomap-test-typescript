import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalCreativeSummaryReport } from "./global-creative-summary-report.js";
import { GlobalCreativeSummary, newGlobalCreativeSummary } from "./global-creative-summary.js";

test("GlobalCreativeSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_230_435);
  const items: GlobalCreativeSummary[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalCreativeSummary(`global-creative-summary-${index}`, "sample"));
  }
  const report = buildGlobalCreativeSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
