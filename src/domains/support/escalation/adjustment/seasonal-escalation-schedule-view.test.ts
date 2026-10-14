import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalEscalationScheduleView,
  toSeasonalEscalationScheduleViews,
} from "./seasonal-escalation-schedule-view.js";
import { newSeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

test("SeasonalEscalationScheduleView shows the status in capitals", () => {
  const item = newSeasonalEscalationSchedule("code-815", "name-358");
  const view = toSeasonalEscalationScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalEscalationScheduleViews([item, item]).length, 2, "views");
});
