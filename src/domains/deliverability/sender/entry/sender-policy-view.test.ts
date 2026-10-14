import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderPolicyView, toSenderPolicyViews } from "./sender-policy-view.js";
import { newSenderPolicy } from "./sender-policy.js";

test("SenderPolicyView shows the status in capitals", () => {
  const item = newSenderPolicy("code-376", "label-597");
  const view = toSenderPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderPolicyViews([item, item]).length, 2, "views");
});
