import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleProfileView, toBidRuleProfileViews } from "./bid-rule-profile-view.js";
import { newBidRuleProfile } from "./bid-rule-profile.js";

test("BidRuleProfileView shows the status in capitals", () => {
  const item = newBidRuleProfile("code-949", "label-795");
  const view = toBidRuleProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleProfileViews([item, item]).length, 2, "views");
});
