import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalApprovalScheduleView,
  toSeasonalApprovalScheduleViews,
} from "./seasonal-approval-schedule-view.js";
import { newSeasonalApprovalSchedule } from "./seasonal-approval-schedule.js";

test("SeasonalApprovalScheduleView shows the status in capitals", () => {
  const item = newSeasonalApprovalSchedule("code-581", "label-583");
  const view = toSeasonalApprovalScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalApprovalScheduleViews([item, item]).length, 2, "views");
});
