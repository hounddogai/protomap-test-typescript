import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalEscalationScoreView, toRegionalEscalationScoreViews } from "./regional-escalation-score-view.js";
import { newRegionalEscalationScore } from "./regional-escalation-score.js";

test("RegionalEscalationScoreView shows the status in capitals", () => {
  const item = newRegionalEscalationScore("code-291", "title-225");
  const view = toRegionalEscalationScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalEscalationScoreViews([item, item]).length, 2, "views");
});
