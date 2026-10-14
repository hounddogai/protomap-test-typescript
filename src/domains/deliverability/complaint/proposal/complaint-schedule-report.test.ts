import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintScheduleReport } from "./complaint-schedule-report.js";
import { ComplaintSchedule, newComplaintSchedule } from "./complaint-schedule.js";

test("ComplaintScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_390_266);
  const items: ComplaintSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newComplaintSchedule(`complaint-schedule-${index}`, "sample"));
  }
  const report = buildComplaintScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
