import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalInviteTargetView, toRegionalInviteTargetViews } from "./regional-invite-target-view.js";
import { newRegionalInviteTarget } from "./regional-invite-target.js";

test("RegionalInviteTargetView shows the status in capitals", () => {
  const item = newRegionalInviteTarget("code-136", "label-781");
  const view = toRegionalInviteTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalInviteTargetViews([item, item]).length, 2, "views");
});
