import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingScheduleView, toPacingScheduleViews } from "./pacing-schedule-view.js";
import { newPacingSchedule } from "./pacing-schedule.js";

test("PacingScheduleView shows the status in capitals", () => {
  const item = newPacingSchedule("code-988", "label-350");
  const view = toPacingScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingScheduleViews([item, item]).length, 2, "views");
});
