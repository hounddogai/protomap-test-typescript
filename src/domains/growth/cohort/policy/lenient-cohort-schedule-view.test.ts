import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientCohortScheduleView, toLenientCohortScheduleViews } from "./lenient-cohort-schedule-view.js";
import { newLenientCohortSchedule } from "./lenient-cohort-schedule.js";

test("LenientCohortScheduleView shows the status in capitals", () => {
  const item = newLenientCohortSchedule("code-776", "label-293");
  const view = toLenientCohortScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientCohortScheduleViews([item, item]).length, 2, "views");
});
