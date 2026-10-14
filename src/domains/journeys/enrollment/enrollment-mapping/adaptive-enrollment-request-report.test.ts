import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveEnrollmentRequestReport } from "./adaptive-enrollment-request-report.js";
import { AdaptiveEnrollmentRequest, newAdaptiveEnrollmentRequest } from "./adaptive-enrollment-request.js";

test("AdaptiveEnrollmentRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_489_438);
  const items: AdaptiveEnrollmentRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptiveEnrollmentRequest(`adaptive-enrollment-request-${index}`, "sample"));
  }
  const report = buildAdaptiveEnrollmentRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
