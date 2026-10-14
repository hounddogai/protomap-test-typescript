import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPacingScheduleReport } from "./weighted-pacing-schedule-report.js";
import { WeightedPacingSchedule, newWeightedPacingSchedule } from "./weighted-pacing-schedule.js";

test("WeightedPacingScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_040_185);
  const items: WeightedPacingSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedPacingSchedule(`weighted-pacing-schedule-${index}`, "sample"));
  }
  const report = buildWeightedPacingScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
