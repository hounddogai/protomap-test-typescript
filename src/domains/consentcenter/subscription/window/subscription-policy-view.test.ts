import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionPolicyView, toSubscriptionPolicyViews } from "./subscription-policy-view.js";
import { newSubscriptionPolicy } from "./subscription-policy.js";

test("SubscriptionPolicyView shows the status in capitals", () => {
  const item = newSubscriptionPolicy("code-259", "label-263");
  const view = toSubscriptionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionPolicyViews([item, item]).length, 2, "views");
});
