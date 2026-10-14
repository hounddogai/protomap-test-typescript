import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualTierPolicyView, toManualTierPolicyViews } from "./manual-tier-policy-view.js";
import { newManualTierPolicy } from "./manual-tier-policy.js";

test("ManualTierPolicyView shows the status in capitals", () => {
  const item = newManualTierPolicy("code-422", "name-70");
  const view = toManualTierPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTierPolicyViews([item, item]).length, 2, "views");
});
