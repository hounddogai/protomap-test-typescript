import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingCsatScheduleView, toRollingCsatScheduleViews } from "./rolling-csat-schedule-view.js";
import { newRollingCsatSchedule } from "./rolling-csat-schedule.js";

test("RollingCsatScheduleView shows the status in capitals", () => {
  const item = newRollingCsatSchedule("code-849", "name-900");
  const view = toRollingCsatScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingCsatScheduleViews([item, item]).length, 2, "views");
});
