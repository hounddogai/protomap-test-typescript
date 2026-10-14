import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualEscalationScheduleView,
  toManualEscalationScheduleViews,
} from "./manual-escalation-schedule-view.js";
import { newManualEscalationSchedule } from "./manual-escalation-schedule.js";

test("ManualEscalationScheduleView shows the status in capitals", () => {
  const item = newManualEscalationSchedule("code-940", "title-481");
  const view = toManualEscalationScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualEscalationScheduleViews([item, item]).length, 2, "views");
});
