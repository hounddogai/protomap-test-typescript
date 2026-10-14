import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalPlacementScheduleView,
  toSeasonalPlacementScheduleViews,
} from "./seasonal-placement-schedule-view.js";
import { newSeasonalPlacementSchedule } from "./seasonal-placement-schedule.js";

test("SeasonalPlacementScheduleView shows the status in capitals", () => {
  const item = newSeasonalPlacementSchedule("code-675", "title-283");
  const view = toSeasonalPlacementScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPlacementScheduleViews([item, item]).length, 2, "views");
});
