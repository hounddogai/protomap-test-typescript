import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleMappingView, toBidRuleMappingViews } from "./bid-rule-mapping-view.js";
import { newBidRuleMapping } from "./bid-rule-mapping.js";

test("BidRuleMappingView shows the status in capitals", () => {
  const item = newBidRuleMapping("code-93", "title-692");
  const view = toBidRuleMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleMappingViews([item, item]).length, 2, "views");
});
