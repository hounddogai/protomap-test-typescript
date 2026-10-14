import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleMappingView, toExitRuleMappingViews } from "./exit-rule-mapping-view.js";
import { newExitRuleMapping } from "./exit-rule-mapping.js";

test("ExitRuleMappingView shows the status in capitals", () => {
  const item = newExitRuleMapping("code-4", "title-120");
  const view = toExitRuleMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleMappingViews([item, item]).length, 2, "views");
});
