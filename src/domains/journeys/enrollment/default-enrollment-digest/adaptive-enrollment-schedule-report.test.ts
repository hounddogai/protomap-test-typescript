import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveEnrollmentScheduleReport } from "./adaptive-enrollment-schedule-report.js";
import { AdaptiveEnrollmentSchedule, newAdaptiveEnrollmentSchedule } from "./adaptive-enrollment-schedule.js";

test("AdaptiveEnrollmentScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_889_946);
  const items: AdaptiveEnrollmentSchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveEnrollmentSchedule(`adaptive-enrollment-schedule-${index}`, "sample"));
  }
  const report = buildAdaptiveEnrollmentScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
