import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedStepScheduleView, toWeightedStepScheduleViews } from "./weighted-step-schedule-view.js";
import { newWeightedStepSchedule } from "./weighted-step-schedule.js";

test("WeightedStepScheduleView shows the status in capitals", () => {
  const item = newWeightedStepSchedule("code-710", "title-407");
  const view = toWeightedStepScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedStepScheduleViews([item, item]).length, 2, "views");
});
