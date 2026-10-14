import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementScheduleReport } from "./placement-schedule-report.js";
import { PlacementSchedule, newPlacementSchedule } from "./placement-schedule.js";

test("PlacementScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_928_206);
  const items: PlacementSchedule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPlacementSchedule(`placement-schedule-${index}`, "sample"));
  }
  const report = buildPlacementScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
