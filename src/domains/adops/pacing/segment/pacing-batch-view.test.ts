import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingBatchView, toPacingBatchViews } from "./pacing-batch-view.js";
import { newPacingBatch } from "./pacing-batch.js";

test("PacingBatchView shows the status in capitals", () => {
  const item = newPacingBatch("code-783", "name-862");
  const view = toPacingBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingBatchViews([item, item]).length, 2, "views");
});
