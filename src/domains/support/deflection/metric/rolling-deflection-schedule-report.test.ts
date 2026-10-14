import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingDeflectionScheduleReport } from "./rolling-deflection-schedule-report.js";
import { RollingDeflectionSchedule, newRollingDeflectionSchedule } from "./rolling-deflection-schedule.js";

test("RollingDeflectionScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_734_451);
  const items: RollingDeflectionSchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingDeflectionSchedule(`rolling-deflection-schedule-${index}`, "sample"));
  }
  const report = buildRollingDeflectionScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
