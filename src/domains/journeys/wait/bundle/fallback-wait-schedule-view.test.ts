import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackWaitScheduleView, toFallbackWaitScheduleViews } from "./fallback-wait-schedule-view.js";
import { newFallbackWaitSchedule } from "./fallback-wait-schedule.js";

test("FallbackWaitScheduleView shows the status in capitals", () => {
  const item = newFallbackWaitSchedule("code-371", "name-153");
  const view = toFallbackWaitScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackWaitScheduleViews([item, item]).length, 2, "views");
});
