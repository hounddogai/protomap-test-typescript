import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInScheduleView, toDoubleOptInScheduleViews } from "./double-opt-in-schedule-view.js";
import { newDoubleOptInSchedule } from "./double-opt-in-schedule.js";

test("DoubleOptInScheduleView shows the status in capitals", () => {
  const item = newDoubleOptInSchedule("code-53", "label-557");
  const view = toDoubleOptInScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInScheduleViews([item, item]).length, 2, "views");
});
