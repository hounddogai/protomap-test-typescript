import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingEscalationScoreView, toRollingEscalationScoreViews } from "./rolling-escalation-score-view.js";
import { newRollingEscalationScore } from "./rolling-escalation-score.js";

test("RollingEscalationScoreView shows the status in capitals", () => {
  const item = newRollingEscalationScore("code-468", "name-563");
  const view = toRollingEscalationScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingEscalationScoreViews([item, item]).length, 2, "views");
});
