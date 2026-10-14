import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveInviteScheduleView, toAdaptiveInviteScheduleViews } from "./adaptive-invite-schedule-view.js";
import { newAdaptiveInviteSchedule } from "./adaptive-invite-schedule.js";

test("AdaptiveInviteScheduleView shows the status in capitals", () => {
  const item = newAdaptiveInviteSchedule("code-988", "label-216");
  const view = toAdaptiveInviteScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveInviteScheduleViews([item, item]).length, 2, "views");
});
