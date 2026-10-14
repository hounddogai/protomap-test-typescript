import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentAdjustmentReport } from "./enrollment-adjustment-report.js";
import { EnrollmentAdjustment, newEnrollmentAdjustment } from "./enrollment-adjustment.js";

test("EnrollmentAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_582_662);
  const items: EnrollmentAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newEnrollmentAdjustment(`enrollment-adjustment-${index}`, "sample"));
  }
  const report = buildEnrollmentAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
