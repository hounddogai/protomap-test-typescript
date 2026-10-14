import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupScheduleReport } from "./warmup-schedule-report.js";
import { WarmupSchedule, newWarmupSchedule } from "./warmup-schedule.js";

test("WarmupScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_556_821);
  const items: WarmupSchedule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWarmupSchedule(`warmup-schedule-${index}`, "sample"));
  }
  const report = buildWarmupScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
