import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultRetentionBatchView, toDefaultRetentionBatchViews } from "./default-retention-batch-view.js";
import { newDefaultRetentionBatch } from "./default-retention-batch.js";

test("DefaultRetentionBatchView shows the status in capitals", () => {
  const item = newDefaultRetentionBatch("code-554", "label-411");
  const view = toDefaultRetentionBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultRetentionBatchViews([item, item]).length, 2, "views");
});
