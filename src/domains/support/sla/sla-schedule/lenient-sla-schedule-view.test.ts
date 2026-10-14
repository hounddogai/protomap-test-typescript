import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientSlaScheduleView, toLenientSlaScheduleViews } from "./lenient-sla-schedule-view.js";
import { newLenientSlaSchedule } from "./lenient-sla-schedule.js";

test("LenientSlaScheduleView shows the status in capitals", () => {
  const item = newLenientSlaSchedule("code-550", "title-932");
  const view = toLenientSlaScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientSlaScheduleViews([item, item]).length, 2, "views");
});
