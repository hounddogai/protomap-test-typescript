import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictApprovalScoreView, toStrictApprovalScoreViews } from "./strict-approval-score-view.js";
import { newStrictApprovalScore } from "./strict-approval-score.js";

test("StrictApprovalScoreView shows the status in capitals", () => {
  const item = newStrictApprovalScore("code-656", "label-295");
  const view = toStrictApprovalScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictApprovalScoreViews([item, item]).length, 2, "views");
});
