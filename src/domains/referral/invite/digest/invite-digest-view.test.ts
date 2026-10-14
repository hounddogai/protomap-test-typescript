import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteDigestView, toInviteDigestViews } from "./invite-digest-view.js";
import { newInviteDigest } from "./invite-digest.js";

test("InviteDigestView shows the status in capitals", () => {
  const item = newInviteDigest("code-747", "title-222");
  const view = toInviteDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteDigestViews([item, item]).length, 2, "views");
});
