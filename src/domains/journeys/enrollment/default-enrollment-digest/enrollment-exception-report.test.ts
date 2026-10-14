import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentExceptionReport } from "./enrollment-exception-report.js";
import { EnrollmentException, newEnrollmentException } from "./enrollment-exception.js";

test("EnrollmentExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_110_339);
  const items: EnrollmentException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newEnrollmentException(`enrollment-exception-${index}`, "sample"));
  }
  const report = buildEnrollmentExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
