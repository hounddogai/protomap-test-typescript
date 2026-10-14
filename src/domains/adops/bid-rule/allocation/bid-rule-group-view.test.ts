import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleGroupView, toBidRuleGroupViews } from "./bid-rule-group-view.js";
import { newBidRuleGroup } from "./bid-rule-group.js";

test("BidRuleGroupView shows the status in capitals", () => {
  const item = newBidRuleGroup("code-480", "title-861");
  const view = toBidRuleGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleGroupViews([item, item]).length, 2, "views");
});
