import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackWaitScheduleReport } from "./fallback-wait-schedule-report.js";
import { FallbackWaitSchedule, newFallbackWaitSchedule } from "./fallback-wait-schedule.js";

test("FallbackWaitScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_711_984);
  const items: FallbackWaitSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackWaitSchedule(`fallback-wait-schedule-${index}`, "sample"));
  }
  const report = buildFallbackWaitScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
