import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightRuleView, toInsightRuleViews } from "./insight-rule-view.js";
import { newInsightRule } from "./insight-rule.js";

test("InsightRuleView shows the status in capitals", () => {
  const item = newInsightRule("code-842", "name-700");
  const view = toInsightRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightRuleViews([item, item]).length, 2, "views");
});
