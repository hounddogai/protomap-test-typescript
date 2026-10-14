import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionScheduleReport } from "./deflection-schedule-report.js";
import { DeflectionSchedule, newDeflectionSchedule } from "./deflection-schedule.js";

test("DeflectionScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_376_457);
  const items: DeflectionSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDeflectionSchedule(`deflection-schedule-${index}`, "sample"));
  }
  const report = buildDeflectionScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
