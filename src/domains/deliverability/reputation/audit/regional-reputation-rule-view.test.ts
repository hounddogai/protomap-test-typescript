import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalReputationRuleView, toRegionalReputationRuleViews } from "./regional-reputation-rule-view.js";
import { newRegionalReputationRule } from "./regional-reputation-rule.js";

test("RegionalReputationRuleView shows the status in capitals", () => {
  const item = newRegionalReputationRule("code-508", "label-385");
  const view = toRegionalReputationRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalReputationRuleViews([item, item]).length, 2, "views");
});
