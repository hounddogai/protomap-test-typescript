import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedLevelEstimateView, toBatchedLevelEstimateViews } from "./batched-level-estimate-view.js";
import { newBatchedLevelEstimate } from "./batched-level-estimate.js";

test("BatchedLevelEstimateView shows the status in capitals", () => {
  const item = newBatchedLevelEstimate("code-356", "name-9");
  const view = toBatchedLevelEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedLevelEstimateViews([item, item]).length, 2, "views");
});
