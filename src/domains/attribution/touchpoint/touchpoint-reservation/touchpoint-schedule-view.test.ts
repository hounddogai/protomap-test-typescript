import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointScheduleView, toTouchpointScheduleViews } from "./touchpoint-schedule-view.js";
import { newTouchpointSchedule } from "./touchpoint-schedule.js";

test("TouchpointScheduleView shows the status in capitals", () => {
  const item = newTouchpointSchedule("code-678", "name-452");
  const view = toTouchpointScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointScheduleViews([item, item]).length, 2, "views");
});
