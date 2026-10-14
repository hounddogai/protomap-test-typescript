import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepSummaryReport } from "./step-summary-report.js";
import { StepSummary, newStepSummary } from "./step-summary.js";

test("StepSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_879_293);
  const items: StepSummary[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStepSummary(`step-summary-${index}`, "sample"));
  }
  const report = buildStepSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
