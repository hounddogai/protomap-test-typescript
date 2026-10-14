import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepScheduleView, toStepScheduleViews } from "./step-schedule-view.js";
import { newStepSchedule } from "./step-schedule.js";

test("StepScheduleView shows the status in capitals", () => {
  const item = newStepSchedule("code-717", "name-115");
  const view = toStepScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepScheduleViews([item, item]).length, 2, "views");
});
