import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledInviteAdjustmentView,
  toScheduledInviteAdjustmentViews,
} from "./scheduled-invite-adjustment-view.js";
import { newScheduledInviteAdjustment } from "./scheduled-invite-adjustment.js";

test("ScheduledInviteAdjustmentView shows the status in capitals", () => {
  const item = newScheduledInviteAdjustment("code-954", "name-221");
  const view = toScheduledInviteAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledInviteAdjustmentViews([item, item]).length, 2, "views");
});
