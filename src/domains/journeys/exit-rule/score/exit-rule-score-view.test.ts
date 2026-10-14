import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleScoreView, toExitRuleScoreViews } from "./exit-rule-score-view.js";
import { newExitRuleScore } from "./exit-rule-score.js";

test("ExitRuleScoreView shows the status in capitals", () => {
  const item = newExitRuleScore("code-718", "name-958");
  const view = toExitRuleScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleScoreViews([item, item]).length, 2, "views");
});
