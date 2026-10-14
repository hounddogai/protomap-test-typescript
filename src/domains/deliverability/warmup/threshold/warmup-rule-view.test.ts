import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupRuleView, toWarmupRuleViews } from "./warmup-rule-view.js";
import { newWarmupRule } from "./warmup-rule.js";

test("WarmupRuleView shows the status in capitals", () => {
  const item = newWarmupRule("code-934", "title-13");
  const view = toWarmupRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupRuleViews([item, item]).length, 2, "views");
});
