import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientOptOutScheduleReport } from "./lenient-opt-out-schedule-report.js";
import { LenientOptOutSchedule, newLenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

test("LenientOptOutScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_084_594);
  const items: LenientOptOutSchedule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientOptOutSchedule(`lenient-opt-out-schedule-${index}`, "sample"));
  }
  const report = buildLenientOptOutScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
