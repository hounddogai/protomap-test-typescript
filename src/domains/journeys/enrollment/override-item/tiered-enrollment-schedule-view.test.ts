import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredEnrollmentScheduleView,
  toTieredEnrollmentScheduleViews,
} from "./tiered-enrollment-schedule-view.js";
import { newTieredEnrollmentSchedule } from "./tiered-enrollment-schedule.js";

test("TieredEnrollmentScheduleView shows the status in capitals", () => {
  const item = newTieredEnrollmentSchedule("code-451", "title-26");
  const view = toTieredEnrollmentScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredEnrollmentScheduleViews([item, item]).length, 2, "views");
});
