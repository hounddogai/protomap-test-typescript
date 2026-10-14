import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofBatchView, toProofBatchViews } from "./proof-batch-view.js";
import { newProofBatch } from "./proof-batch.js";

test("ProofBatchView shows the status in capitals", () => {
  const item = newProofBatch("code-53", "label-518");
  const view = toProofBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofBatchViews([item, item]).length, 2, "views");
});
