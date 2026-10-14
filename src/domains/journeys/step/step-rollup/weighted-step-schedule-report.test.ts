import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedStepScheduleReport } from "./weighted-step-schedule-report.js";
import { WeightedStepSchedule, newWeightedStepSchedule } from "./weighted-step-schedule.js";

test("WeightedStepScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_519_710);
  const items: WeightedStepSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedStepSchedule(`weighted-step-schedule-${index}`, "sample"));
  }
  const report = buildWeightedStepScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
