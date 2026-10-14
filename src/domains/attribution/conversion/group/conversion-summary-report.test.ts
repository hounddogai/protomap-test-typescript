import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionSummaryReport } from "./conversion-summary-report.js";
import { ConversionSummary, newConversionSummary } from "./conversion-summary.js";

test("ConversionSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_535_869);
  const items: ConversionSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newConversionSummary(`conversion-summary-${index}`, "sample"));
  }
  const report = buildConversionSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
