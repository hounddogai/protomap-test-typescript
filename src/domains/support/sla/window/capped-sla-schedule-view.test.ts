import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedSlaScheduleView, toCappedSlaScheduleViews } from "./capped-sla-schedule-view.js";
import { newCappedSlaSchedule } from "./capped-sla-schedule.js";

test("CappedSlaScheduleView shows the status in capitals", () => {
  const item = newCappedSlaSchedule("code-519", "name-600");
  const view = toCappedSlaScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedSlaScheduleViews([item, item]).length, 2, "views");
});
