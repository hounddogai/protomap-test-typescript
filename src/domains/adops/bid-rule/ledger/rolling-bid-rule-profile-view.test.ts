import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingBidRuleProfileView, toRollingBidRuleProfileViews } from "./rolling-bid-rule-profile-view.js";
import { newRollingBidRuleProfile } from "./rolling-bid-rule-profile.js";

test("RollingBidRuleProfileView shows the status in capitals", () => {
  const item = newRollingBidRuleProfile("code-27", "label-776");
  const view = toRollingBidRuleProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingBidRuleProfileViews([item, item]).length, 2, "views");
});
