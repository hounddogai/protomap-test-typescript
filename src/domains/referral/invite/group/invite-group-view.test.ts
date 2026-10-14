import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteGroupView, toInviteGroupViews } from "./invite-group-view.js";
import { newInviteGroup } from "./invite-group.js";

test("InviteGroupView shows the status in capitals", () => {
  const item = newInviteGroup("code-879", "name-103");
  const view = toInviteGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteGroupViews([item, item]).length, 2, "views");
});
