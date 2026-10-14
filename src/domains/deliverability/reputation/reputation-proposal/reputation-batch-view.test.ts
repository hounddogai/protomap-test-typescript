import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationBatchView, toReputationBatchViews } from "./reputation-batch-view.js";
import { newReputationBatch } from "./reputation-batch.js";

test("ReputationBatchView shows the status in capitals", () => {
  const item = newReputationBatch("code-327", "name-55");
  const view = toReputationBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationBatchViews([item, item]).length, 2, "views");
});
