import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationScheduleView, toEscalationScheduleViews } from "./escalation-schedule-view.js";
import { newEscalationSchedule } from "./escalation-schedule.js";

test("EscalationScheduleView shows the status in capitals", () => {
  const item = newEscalationSchedule("code-441", "label-105");
  const view = toEscalationScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationScheduleViews([item, item]).length, 2, "views");
});
