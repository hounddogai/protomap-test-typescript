import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepScheduleReport } from "./step-schedule-report.js";
import { StepSchedule, newStepSchedule } from "./step-schedule.js";

test("StepScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_218_344);
  const items: StepSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStepSchedule(`step-schedule-${index}`, "sample"));
  }
  const report = buildStepScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
