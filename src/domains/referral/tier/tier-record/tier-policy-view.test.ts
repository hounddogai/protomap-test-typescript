import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierPolicyView, toTierPolicyViews } from "./tier-policy-view.js";
import { newTierPolicy } from "./tier-policy.js";

test("TierPolicyView shows the status in capitals", () => {
  const item = newTierPolicy("code-866", "label-913");
  const view = toTierPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierPolicyViews([item, item]).length, 2, "views");
});
