import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalMentionScheduleView, toSeasonalMentionScheduleViews } from "./seasonal-mention-schedule-view.js";
import { newSeasonalMentionSchedule } from "./seasonal-mention-schedule.js";

test("SeasonalMentionScheduleView shows the status in capitals", () => {
  const item = newSeasonalMentionSchedule("code-417", "label-756");
  const view = toSeasonalMentionScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalMentionScheduleViews([item, item]).length, 2, "views");
});
