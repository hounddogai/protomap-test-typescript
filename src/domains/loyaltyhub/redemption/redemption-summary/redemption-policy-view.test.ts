import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionPolicyView, toRedemptionPolicyViews } from "./redemption-policy-view.js";
import { newRedemptionPolicy } from "./redemption-policy.js";

test("RedemptionPolicyView shows the status in capitals", () => {
  const item = newRedemptionPolicy("code-450", "label-289");
  const view = toRedemptionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionPolicyViews([item, item]).length, 2, "views");
});
