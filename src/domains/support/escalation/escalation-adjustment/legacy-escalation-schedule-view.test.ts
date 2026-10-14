import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyEscalationScheduleView,
  toLegacyEscalationScheduleViews,
} from "./legacy-escalation-schedule-view.js";
import { newLegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

test("LegacyEscalationScheduleView shows the status in capitals", () => {
  const item = newLegacyEscalationSchedule("code-223", "name-425");
  const view = toLegacyEscalationScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyEscalationScheduleViews([item, item]).length, 2, "views");
});
