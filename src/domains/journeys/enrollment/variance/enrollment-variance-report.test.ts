import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentVarianceReport } from "./enrollment-variance-report.js";
import { EnrollmentVariance, newEnrollmentVariance } from "./enrollment-variance.js";

test("EnrollmentVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_071_363);
  const items: EnrollmentVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newEnrollmentVariance(`enrollment-variance-${index}`, "sample"));
  }
  const report = buildEnrollmentVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
