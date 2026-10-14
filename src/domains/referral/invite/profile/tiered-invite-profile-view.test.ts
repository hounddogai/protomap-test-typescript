import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredInviteProfileView, toTieredInviteProfileViews } from "./tiered-invite-profile-view.js";
import { newTieredInviteProfile } from "./tiered-invite-profile.js";

test("TieredInviteProfileView shows the status in capitals", () => {
  const item = newTieredInviteProfile("code-274", "title-21");
  const view = toTieredInviteProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredInviteProfileViews([item, item]).length, 2, "views");
});
