import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintScoreView, toComplaintScoreViews } from "./complaint-score-view.js";
import { newComplaintScore } from "./complaint-score.js";

test("ComplaintScoreView shows the status in capitals", () => {
  const item = newComplaintScore("code-172", "title-759");
  const view = toComplaintScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintScoreViews([item, item]).length, 2, "views");
});
