import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleWindowView, toBidRuleWindowViews } from "./bid-rule-window-view.js";
import { newBidRuleWindow } from "./bid-rule-window.js";

test("BidRuleWindowView shows the status in capitals", () => {
  const item = newBidRuleWindow("code-23", "label-631");
  const view = toBidRuleWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleWindowViews([item, item]).length, 2, "views");
});
