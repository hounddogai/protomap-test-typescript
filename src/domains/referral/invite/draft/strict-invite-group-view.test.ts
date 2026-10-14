import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictInviteGroupView, toStrictInviteGroupViews } from "./strict-invite-group-view.js";
import { newStrictInviteGroup } from "./strict-invite-group.js";

test("StrictInviteGroupView shows the status in capitals", () => {
  const item = newStrictInviteGroup("code-59", "name-672");
  const view = toStrictInviteGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictInviteGroupViews([item, item]).length, 2, "views");
});
