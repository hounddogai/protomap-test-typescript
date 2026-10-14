import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySenderRuleView, toPrimarySenderRuleViews } from "./primary-sender-rule-view.js";
import { newPrimarySenderRule } from "./primary-sender-rule.js";

test("PrimarySenderRuleView shows the status in capitals", () => {
  const item = newPrimarySenderRule("code-630", "title-151");
  const view = toPrimarySenderRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySenderRuleViews([item, item]).length, 2, "views");
});
