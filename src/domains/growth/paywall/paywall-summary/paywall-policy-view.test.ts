import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallPolicyView, toPaywallPolicyViews } from "./paywall-policy-view.js";
import { newPaywallPolicy } from "./paywall-policy.js";

test("PaywallPolicyView shows the status in capitals", () => {
  const item = newPaywallPolicy("code-804", "name-518");
  const view = toPaywallPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallPolicyViews([item, item]).length, 2, "views");
});
