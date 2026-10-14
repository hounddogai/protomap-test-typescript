import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalExitRuleBaselineView,
  toRegionalExitRuleBaselineViews,
} from "./regional-exit-rule-baseline-view.js";
import { newRegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

test("RegionalExitRuleBaselineView shows the status in capitals", () => {
  const item = newRegionalExitRuleBaseline("code-560", "name-152");
  const view = toRegionalExitRuleBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalExitRuleBaselineViews([item, item]).length, 2, "views");
});
