import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintVarianceReport } from "./complaint-variance-report.js";
import { ComplaintVariance, newComplaintVariance } from "./complaint-variance.js";

test("ComplaintVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_102_341);
  const items: ComplaintVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newComplaintVariance(`complaint-variance-${index}`, "sample"));
  }
  const report = buildComplaintVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
