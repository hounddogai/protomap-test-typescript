import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledSlaRuleView, toScheduledSlaRuleViews } from "./scheduled-sla-rule-view.js";
import { newScheduledSlaRule } from "./scheduled-sla-rule.js";

test("ScheduledSlaRuleView shows the status in capitals", () => {
  const item = newScheduledSlaRule("code-718", "title-388");
  const view = toScheduledSlaRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledSlaRuleViews([item, item]).length, 2, "views");
});
