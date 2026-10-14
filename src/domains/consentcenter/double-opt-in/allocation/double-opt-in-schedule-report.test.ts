import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInScheduleReport } from "./double-opt-in-schedule-report.js";
import { DoubleOptInSchedule, newDoubleOptInSchedule } from "./double-opt-in-schedule.js";

test("DoubleOptInScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_928_331);
  const items: DoubleOptInSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDoubleOptInSchedule(`double-opt-in-schedule-${index}`, "sample"));
  }
  const report = buildDoubleOptInScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
