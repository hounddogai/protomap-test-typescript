import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedNudgeVarianceView, toBatchedNudgeVarianceViews } from "./batched-nudge-variance-view.js";
import { newBatchedNudgeVariance } from "./batched-nudge-variance.js";

test("BatchedNudgeVarianceView shows the status in capitals", () => {
  const item = newBatchedNudgeVariance("code-649", "label-628");
  const view = toBatchedNudgeVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedNudgeVarianceViews([item, item]).length, 2, "views");
});
