import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutScheduleReport } from "./opt-out-schedule-report.js";
import { OptOutSchedule, newOptOutSchedule } from "./opt-out-schedule.js";

test("OptOutScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_797_109);
  const items: OptOutSchedule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newOptOutSchedule(`opt-out-schedule-${index}`, "sample"));
  }
  const report = buildOptOutScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
