import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionSummaryReport } from "./deflection-summary-report.js";
import { DeflectionSummary, newDeflectionSummary } from "./deflection-summary.js";

test("DeflectionSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_792_726);
  const items: DeflectionSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDeflectionSummary(`deflection-summary-${index}`, "sample"));
  }
  const report = buildDeflectionSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
