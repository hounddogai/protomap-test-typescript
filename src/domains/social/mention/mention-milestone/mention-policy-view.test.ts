import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionPolicyView, toMentionPolicyViews } from "./mention-policy-view.js";
import { newMentionPolicy } from "./mention-policy.js";

test("MentionPolicyView shows the status in capitals", () => {
  const item = newMentionPolicy("code-17", "label-973");
  const view = toMentionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionPolicyViews([item, item]).length, 2, "views");
});
