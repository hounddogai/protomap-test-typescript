import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchBatchView, toBranchBatchViews } from "./branch-batch-view.js";
import { newBranchBatch } from "./branch-batch.js";

test("BranchBatchView shows the status in capitals", () => {
  const item = newBranchBatch("code-444", "name-910");
  const view = toBranchBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchBatchViews([item, item]).length, 2, "views");
});
