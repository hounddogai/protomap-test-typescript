import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelScheduleView, toFunnelScheduleViews } from "./funnel-schedule-view.js";
import { newFunnelSchedule } from "./funnel-schedule.js";

test("FunnelScheduleView shows the status in capitals", () => {
  const item = newFunnelSchedule("code-519", "title-846");
  const view = toFunnelScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelScheduleViews([item, item]).length, 2, "views");
});
