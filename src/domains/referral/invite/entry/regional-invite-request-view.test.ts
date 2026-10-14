import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalInviteRequestView, toRegionalInviteRequestViews } from "./regional-invite-request-view.js";
import { newRegionalInviteRequest } from "./regional-invite-request.js";

test("RegionalInviteRequestView shows the status in capitals", () => {
  const item = newRegionalInviteRequest("code-218", "label-798");
  const view = toRegionalInviteRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalInviteRequestViews([item, item]).length, 2, "views");
});
