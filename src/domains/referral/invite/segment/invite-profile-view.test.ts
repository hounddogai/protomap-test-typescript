import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteProfileView, toInviteProfileViews } from "./invite-profile-view.js";
import { newInviteProfile } from "./invite-profile.js";

test("InviteProfileView shows the status in capitals", () => {
  const item = newInviteProfile("code-63", "title-666");
  const view = toInviteProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteProfileViews([item, item]).length, 2, "views");
});
