import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleExceptionView, toBidRuleExceptionViews } from "./bid-rule-exception-view.js";
import { newBidRuleException } from "./bid-rule-exception.js";

test("BidRuleExceptionView shows the status in capitals", () => {
  const item = newBidRuleException("code-774", "label-97");
  const view = toBidRuleExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleExceptionViews([item, item]).length, 2, "views");
});
