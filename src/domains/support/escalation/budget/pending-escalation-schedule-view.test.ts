import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingEscalationScheduleView,
  toPendingEscalationScheduleViews,
} from "./pending-escalation-schedule-view.js";
import { newPendingEscalationSchedule } from "./pending-escalation-schedule.js";

test("PendingEscalationScheduleView shows the status in capitals", () => {
  const item = newPendingEscalationSchedule("code-978", "name-908");
  const view = toPendingEscalationScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingEscalationScheduleViews([item, item]).length, 2, "views");
});
