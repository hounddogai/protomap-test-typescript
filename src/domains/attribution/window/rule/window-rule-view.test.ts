import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowRuleView, toWindowRuleViews } from "./window-rule-view.js";
import { newWindowRule } from "./window-rule.js";

test("WindowRuleView shows the status in capitals", () => {
  const item = newWindowRule("code-971", "name-43");
  const view = toWindowRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowRuleViews([item, item]).length, 2, "views");
});
