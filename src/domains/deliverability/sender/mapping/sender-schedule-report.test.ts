import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderScheduleReport } from "./sender-schedule-report.js";
import { SenderSchedule, newSenderSchedule } from "./sender-schedule.js";

test("SenderScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_286_512);
  const items: SenderSchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSenderSchedule(`sender-schedule-${index}`, "sample"));
  }
  const report = buildSenderScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
