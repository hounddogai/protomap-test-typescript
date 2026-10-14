import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedDeflectionScheduleView,
  toWeightedDeflectionScheduleViews,
} from "./weighted-deflection-schedule-view.js";
import { newWeightedDeflectionSchedule } from "./weighted-deflection-schedule.js";

test("WeightedDeflectionScheduleView shows the status in capitals", () => {
  const item = newWeightedDeflectionSchedule("code-476", "title-952");
  const view = toWeightedDeflectionScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedDeflectionScheduleViews([item, item]).length, 2, "views");
});
