import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInRuleView, toDoubleOptInRuleViews } from "./double-opt-in-rule-view.js";
import { newDoubleOptInRule } from "./double-opt-in-rule.js";

test("DoubleOptInRuleView shows the status in capitals", () => {
  const item = newDoubleOptInRule("code-128", "name-91");
  const view = toDoubleOptInRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInRuleViews([item, item]).length, 2, "views");
});
