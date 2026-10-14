import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCreditScheduleView, toLegacyCreditScheduleViews } from "./legacy-credit-schedule-view.js";
import { newLegacyCreditSchedule } from "./legacy-credit-schedule.js";

test("LegacyCreditScheduleView shows the status in capitals", () => {
  const item = newLegacyCreditSchedule("code-196", "label-388");
  const view = toLegacyCreditScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCreditScheduleViews([item, item]).length, 2, "views");
});
