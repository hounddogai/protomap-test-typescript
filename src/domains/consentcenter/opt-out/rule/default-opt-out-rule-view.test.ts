import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultOptOutRuleView, toDefaultOptOutRuleViews } from "./default-opt-out-rule-view.js";
import { newDefaultOptOutRule } from "./default-opt-out-rule.js";

test("DefaultOptOutRuleView shows the status in capitals", () => {
  const item = newDefaultOptOutRule("code-799", "name-315");
  const view = toDefaultOptOutRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultOptOutRuleViews([item, item]).length, 2, "views");
});
