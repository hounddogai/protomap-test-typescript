import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientCohortScheduleReport } from "./lenient-cohort-schedule-report.js";
import { LenientCohortSchedule, newLenientCohortSchedule } from "./lenient-cohort-schedule.js";

test("LenientCohortScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_775_803);
  const items: LenientCohortSchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientCohortSchedule(`lenient-cohort-schedule-${index}`, "sample"));
  }
  const report = buildLenientCohortScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
