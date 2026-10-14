import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelScheduleView, toLevelScheduleViews } from "./level-schedule-view.js";
import { newLevelSchedule } from "./level-schedule.js";

test("LevelScheduleView shows the status in capitals", () => {
  const item = newLevelSchedule("code-957", "name-630");
  const view = toLevelScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelScheduleViews([item, item]).length, 2, "views");
});
