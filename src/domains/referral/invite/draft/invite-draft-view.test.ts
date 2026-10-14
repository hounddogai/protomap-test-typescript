import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteDraftView, toInviteDraftViews } from "./invite-draft-view.js";
import { newInviteDraft } from "./invite-draft.js";

test("InviteDraftView shows the status in capitals", () => {
  const item = newInviteDraft("code-165", "name-623");
  const view = toInviteDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteDraftViews([item, item]).length, 2, "views");
});
