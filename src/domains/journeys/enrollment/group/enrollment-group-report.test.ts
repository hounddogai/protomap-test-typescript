import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentGroupReport } from "./enrollment-group-report.js";
import { EnrollmentGroup, newEnrollmentGroup } from "./enrollment-group.js";

test("EnrollmentGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_499_615);
  const items: EnrollmentGroup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newEnrollmentGroup(`enrollment-group-${index}`, "sample"));
  }
  const report = buildEnrollmentGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
