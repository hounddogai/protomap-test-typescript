import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledRedemptionPolicyView,
  toScheduledRedemptionPolicyViews,
} from "./scheduled-redemption-policy-view.js";
import { newScheduledRedemptionPolicy } from "./scheduled-redemption-policy.js";

test("ScheduledRedemptionPolicyView shows the status in capitals", () => {
  const item = newScheduledRedemptionPolicy("code-715", "title-653");
  const view = toScheduledRedemptionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledRedemptionPolicyViews([item, item]).length, 2, "views");
});
