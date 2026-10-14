import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedInviteScheduleView, toBatchedInviteScheduleViews } from "./batched-invite-schedule-view.js";
import { newBatchedInviteSchedule } from "./batched-invite-schedule.js";

test("BatchedInviteScheduleView shows the status in capitals", () => {
  const item = newBatchedInviteSchedule("code-922", "title-407");
  const view = toBatchedInviteScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedInviteScheduleViews([item, item]).length, 2, "views");
});
