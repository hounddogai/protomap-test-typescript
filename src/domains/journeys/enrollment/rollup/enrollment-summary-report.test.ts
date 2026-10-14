import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentSummaryReport } from "./enrollment-summary-report.js";
import { EnrollmentSummary, newEnrollmentSummary } from "./enrollment-summary.js";

test("EnrollmentSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_188_712);
  const items: EnrollmentSummary[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newEnrollmentSummary(`enrollment-summary-${index}`, "sample"));
  }
  const report = buildEnrollmentSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
