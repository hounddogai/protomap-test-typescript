import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteRequestView, toInviteRequestViews } from "./invite-request-view.js";
import { newInviteRequest } from "./invite-request.js";

test("InviteRequestView shows the status in capitals", () => {
  const item = newInviteRequest("code-518", "title-601");
  const view = toInviteRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteRequestViews([item, item]).length, 2, "views");
});
