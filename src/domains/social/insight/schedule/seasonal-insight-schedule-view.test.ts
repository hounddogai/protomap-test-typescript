import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalInsightScheduleView, toSeasonalInsightScheduleViews } from "./seasonal-insight-schedule-view.js";
import { newSeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

test("SeasonalInsightScheduleView shows the status in capitals", () => {
  const item = newSeasonalInsightSchedule("code-535", "title-585");
  const view = toSeasonalInsightScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalInsightScheduleViews([item, item]).length, 2, "views");
});
