import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedApprovalScheduleView,
  toWeightedApprovalScheduleViews,
} from "./weighted-approval-schedule-view.js";
import { newWeightedApprovalSchedule } from "./weighted-approval-schedule.js";

test("WeightedApprovalScheduleView shows the status in capitals", () => {
  const item = newWeightedApprovalSchedule("code-714", "name-792");
  const view = toWeightedApprovalScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedApprovalScheduleViews([item, item]).length, 2, "views");
});
