import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalWaitScheduleView, toSeasonalWaitScheduleViews } from "./seasonal-wait-schedule-view.js";
import { newSeasonalWaitSchedule } from "./seasonal-wait-schedule.js";

test("SeasonalWaitScheduleView shows the status in capitals", () => {
  const item = newSeasonalWaitSchedule("code-351", "title-579");
  const view = toSeasonalWaitScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalWaitScheduleViews([item, item]).length, 2, "views");
});
