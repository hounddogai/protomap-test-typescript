import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedExitRuleMappingView, toBatchedExitRuleMappingViews } from "./batched-exit-rule-mapping-view.js";
import { newBatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

test("BatchedExitRuleMappingView shows the status in capitals", () => {
  const item = newBatchedExitRuleMapping("code-523", "label-906");
  const view = toBatchedExitRuleMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedExitRuleMappingViews([item, item]).length, 2, "views");
});
