import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionScheduleView, toRetentionScheduleViews } from "./retention-schedule-view.js";
import { newRetentionSchedule } from "./retention-schedule.js";

test("RetentionScheduleView shows the status in capitals", () => {
  const item = newRetentionSchedule("code-667", "label-244");
  const view = toRetentionScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionScheduleViews([item, item]).length, 2, "views");
});
