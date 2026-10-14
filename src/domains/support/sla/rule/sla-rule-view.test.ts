import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaRuleView, toSlaRuleViews } from "./sla-rule-view.js";
import { newSlaRule } from "./sla-rule.js";

test("SlaRuleView shows the status in capitals", () => {
  const item = newSlaRule("code-428", "label-585");
  const view = toSlaRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaRuleViews([item, item]).length, 2, "views");
});
