import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitScheduleView, toWaitScheduleViews } from "./wait-schedule-view.js";
import { newWaitSchedule } from "./wait-schedule.js";

test("WaitScheduleView shows the status in capitals", () => {
  const item = newWaitSchedule("code-697", "name-205");
  const view = toWaitScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitScheduleViews([item, item]).length, 2, "views");
});
