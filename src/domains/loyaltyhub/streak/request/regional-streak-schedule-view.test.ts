import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalStreakScheduleView, toRegionalStreakScheduleViews } from "./regional-streak-schedule-view.js";
import { newRegionalStreakSchedule } from "./regional-streak-schedule.js";

test("RegionalStreakScheduleView shows the status in capitals", () => {
  const item = newRegionalStreakSchedule("code-342", "label-732");
  const view = toRegionalStreakScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalStreakScheduleViews([item, item]).length, 2, "views");
});
