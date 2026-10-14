import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedEnrollmentEstimateReport } from "./capped-enrollment-estimate-report.js";
import { CappedEnrollmentEstimate, newCappedEnrollmentEstimate } from "./capped-enrollment-estimate.js";

test("CappedEnrollmentEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_033_088);
  const items: CappedEnrollmentEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedEnrollmentEstimate(`capped-enrollment-estimate-${index}`, "sample"));
  }
  const report = buildCappedEnrollmentEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
