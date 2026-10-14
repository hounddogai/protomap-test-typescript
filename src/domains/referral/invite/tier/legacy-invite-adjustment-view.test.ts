import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyInviteAdjustmentView, toLegacyInviteAdjustmentViews } from "./legacy-invite-adjustment-view.js";
import { newLegacyInviteAdjustment } from "./legacy-invite-adjustment.js";

test("LegacyInviteAdjustmentView shows the status in capitals", () => {
  const item = newLegacyInviteAdjustment("code-588", "name-517");
  const view = toLegacyInviteAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyInviteAdjustmentViews([item, item]).length, 2, "views");
});
