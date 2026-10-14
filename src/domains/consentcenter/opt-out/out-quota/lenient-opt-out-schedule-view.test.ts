import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientOptOutScheduleView, toLenientOptOutScheduleViews } from "./lenient-opt-out-schedule-view.js";
import { newLenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

test("LenientOptOutScheduleView shows the status in capitals", () => {
  const item = newLenientOptOutSchedule("code-803", "name-539");
  const view = toLenientOptOutScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientOptOutScheduleViews([item, item]).length, 2, "views");
});
