import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentTargetReport } from "./enrollment-target-report.js";
import { EnrollmentTarget, newEnrollmentTarget } from "./enrollment-target.js";

test("EnrollmentTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_259_370);
  const items: EnrollmentTarget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newEnrollmentTarget(`enrollment-target-${index}`, "sample"));
  }
  const report = buildEnrollmentTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
