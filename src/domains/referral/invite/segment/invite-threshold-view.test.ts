import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteThresholdView, toInviteThresholdViews } from "./invite-threshold-view.js";
import { newInviteThreshold } from "./invite-threshold.js";

test("InviteThresholdView shows the status in capitals", () => {
  const item = newInviteThreshold("code-555", "title-439");
  const view = toInviteThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteThresholdViews([item, item]).length, 2, "views");
});
