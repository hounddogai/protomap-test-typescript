import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleOverrideView, toExitRuleOverrideViews } from "./exit-rule-override-view.js";
import { newExitRuleOverride } from "./exit-rule-override.js";

test("ExitRuleOverrideView shows the status in capitals", () => {
  const item = newExitRuleOverride("code-448", "name-527");
  const view = toExitRuleOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleOverrideViews([item, item]).length, 2, "views");
});
