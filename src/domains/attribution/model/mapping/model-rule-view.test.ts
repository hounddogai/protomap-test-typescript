import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelRuleView, toModelRuleViews } from "./model-rule-view.js";
import { newModelRule } from "./model-rule.js";

test("ModelRuleView shows the status in capitals", () => {
  const item = newModelRule("code-604", "name-216");
  const view = toModelRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelRuleViews([item, item]).length, 2, "views");
});
