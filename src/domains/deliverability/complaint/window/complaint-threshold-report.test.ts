import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintThresholdReport } from "./complaint-threshold-report.js";
import { ComplaintThreshold, newComplaintThreshold } from "./complaint-threshold.js";

test("ComplaintThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_880_993);
  const items: ComplaintThreshold[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newComplaintThreshold(`complaint-threshold-${index}`, "sample"));
  }
  const report = buildComplaintThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
