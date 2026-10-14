import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleThresholdView, toExitRuleThresholdViews } from "./exit-rule-threshold-view.js";
import { newExitRuleThreshold } from "./exit-rule-threshold.js";

test("ExitRuleThresholdView shows the status in capitals", () => {
  const item = newExitRuleThreshold("code-235", "name-76");
  const view = toExitRuleThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleThresholdViews([item, item]).length, 2, "views");
});
