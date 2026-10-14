import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingCsatScheduleReport } from "./rolling-csat-schedule-report.js";
import { RollingCsatSchedule, newRollingCsatSchedule } from "./rolling-csat-schedule.js";

test("RollingCsatScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_406_057);
  const items: RollingCsatSchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingCsatSchedule(`rolling-csat-schedule-${index}`, "sample"));
  }
  const report = buildRollingCsatScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
