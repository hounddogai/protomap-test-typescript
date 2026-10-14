import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleTargetView, toExitRuleTargetViews } from "./exit-rule-target-view.js";
import { newExitRuleTarget } from "./exit-rule-target.js";

test("ExitRuleTargetView shows the status in capitals", () => {
  const item = newExitRuleTarget("code-694", "name-827");
  const view = toExitRuleTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleTargetViews([item, item]).length, 2, "views");
});
