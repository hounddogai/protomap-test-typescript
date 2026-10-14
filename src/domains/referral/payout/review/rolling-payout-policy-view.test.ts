import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPayoutPolicyView, toRollingPayoutPolicyViews } from "./rolling-payout-policy-view.js";
import { newRollingPayoutPolicy } from "./rolling-payout-policy.js";

test("RollingPayoutPolicyView shows the status in capitals", () => {
  const item = newRollingPayoutPolicy("code-551", "title-980");
  const view = toRollingPayoutPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPayoutPolicyViews([item, item]).length, 2, "views");
});
