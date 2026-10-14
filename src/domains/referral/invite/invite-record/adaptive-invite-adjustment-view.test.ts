import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveInviteAdjustmentView,
  toAdaptiveInviteAdjustmentViews,
} from "./adaptive-invite-adjustment-view.js";
import { newAdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

test("AdaptiveInviteAdjustmentView shows the status in capitals", () => {
  const item = newAdaptiveInviteAdjustment("code-950", "name-651");
  const view = toAdaptiveInviteAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveInviteAdjustmentViews([item, item]).length, 2, "views");
});
