import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveEnrollmentScheduleView,
  toAdaptiveEnrollmentScheduleViews,
} from "./adaptive-enrollment-schedule-view.js";
import { newAdaptiveEnrollmentSchedule } from "./adaptive-enrollment-schedule.js";

test("AdaptiveEnrollmentScheduleView shows the status in capitals", () => {
  const item = newAdaptiveEnrollmentSchedule("code-274", "name-512");
  const view = toAdaptiveEnrollmentScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveEnrollmentScheduleViews([item, item]).length, 2, "views");
});
