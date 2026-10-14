import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalApprovalScoreView, toSeasonalApprovalScoreViews } from "./seasonal-approval-score-view.js";
import { newSeasonalApprovalScore } from "./seasonal-approval-score.js";

test("SeasonalApprovalScoreView shows the status in capitals", () => {
  const item = newSeasonalApprovalScore("code-812", "name-682");
  const view = toSeasonalApprovalScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalApprovalScoreViews([item, item]).length, 2, "views");
});
