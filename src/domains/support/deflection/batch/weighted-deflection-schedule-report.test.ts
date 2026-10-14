import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedDeflectionScheduleReport } from "./weighted-deflection-schedule-report.js";
import { WeightedDeflectionSchedule, newWeightedDeflectionSchedule } from "./weighted-deflection-schedule.js";

test("WeightedDeflectionScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_323_939);
  const items: WeightedDeflectionSchedule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedDeflectionSchedule(`weighted-deflection-schedule-${index}`, "sample"));
  }
  const report = buildWeightedDeflectionScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
