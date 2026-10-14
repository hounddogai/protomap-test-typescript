import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyPolicyView, toReplyPolicyViews } from "./reply-policy-view.js";
import { newReplyPolicy } from "./reply-policy.js";

test("ReplyPolicyView shows the status in capitals", () => {
  const item = newReplyPolicy("code-580", "name-805");
  const view = toReplyPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyPolicyViews([item, item]).length, 2, "views");
});
