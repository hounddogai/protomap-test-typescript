import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultProofBatchView, toDefaultProofBatchViews } from "./default-proof-batch-view.js";
import { newDefaultProofBatch } from "./default-proof-batch.js";

test("DefaultProofBatchView shows the status in capitals", () => {
  const item = newDefaultProofBatch("code-457", "title-654");
  const view = toDefaultProofBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultProofBatchViews([item, item]).length, 2, "views");
});
