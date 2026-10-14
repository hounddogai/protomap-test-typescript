import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingInviteBundleView, toRollingInviteBundleViews } from "./rolling-invite-bundle-view.js";
import { newRollingInviteBundle } from "./rolling-invite-bundle.js";

test("RollingInviteBundleView shows the status in capitals", () => {
  const item = newRollingInviteBundle("code-721", "name-336");
  const view = toRollingInviteBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingInviteBundleViews([item, item]).length, 2, "views");
});
