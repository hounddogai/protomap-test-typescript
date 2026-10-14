import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalScoreView, toApprovalScoreViews } from "./approval-score-view.js";
import { newApprovalScore } from "./approval-score.js";

test("ApprovalScoreView shows the status in capitals", () => {
  const item = newApprovalScore("code-6", "title-914");
  const view = toApprovalScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalScoreViews([item, item]).length, 2, "views");
});
