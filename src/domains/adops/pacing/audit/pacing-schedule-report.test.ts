import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingScheduleReport } from "./pacing-schedule-report.js";
import { PacingSchedule, newPacingSchedule } from "./pacing-schedule.js";

test("PacingScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_537_483);
  const items: PacingSchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPacingSchedule(`pacing-schedule-${index}`, "sample"));
  }
  const report = buildPacingScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
