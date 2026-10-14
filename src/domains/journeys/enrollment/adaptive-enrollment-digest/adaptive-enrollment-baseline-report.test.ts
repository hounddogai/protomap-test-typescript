import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveEnrollmentBaselineReport } from "./adaptive-enrollment-baseline-report.js";
import { AdaptiveEnrollmentBaseline, newAdaptiveEnrollmentBaseline } from "./adaptive-enrollment-baseline.js";

test("AdaptiveEnrollmentBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_554_050);
  const items: AdaptiveEnrollmentBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveEnrollmentBaseline(`adaptive-enrollment-baseline-${index}`, "sample"));
  }
  const report = buildAdaptiveEnrollmentBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
