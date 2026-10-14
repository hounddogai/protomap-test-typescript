import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingRedemptionPolicyView, toPendingRedemptionPolicyViews } from "./pending-redemption-policy-view.js";
import { newPendingRedemptionPolicy } from "./pending-redemption-policy.js";

test("PendingRedemptionPolicyView shows the status in capitals", () => {
  const item = newPendingRedemptionPolicy("code-187", "title-904");
  const view = toPendingRedemptionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRedemptionPolicyViews([item, item]).length, 2, "views");
});
