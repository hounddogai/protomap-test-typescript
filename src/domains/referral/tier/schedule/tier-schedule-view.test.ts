import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierScheduleView, toTierScheduleViews } from "./tier-schedule-view.js";
import { newTierSchedule } from "./tier-schedule.js";

test("TierScheduleView shows the status in capitals", () => {
  const item = newTierSchedule("code-864", "name-433");
  const view = toTierScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierScheduleViews([item, item]).length, 2, "views");
});
