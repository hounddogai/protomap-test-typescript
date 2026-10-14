import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedPacingScheduleView, toWeightedPacingScheduleViews } from "./weighted-pacing-schedule-view.js";
import { newWeightedPacingSchedule } from "./weighted-pacing-schedule.js";

test("WeightedPacingScheduleView shows the status in capitals", () => {
  const item = newWeightedPacingSchedule("code-708", "name-270");
  const view = toWeightedPacingScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPacingScheduleViews([item, item]).length, 2, "views");
});
