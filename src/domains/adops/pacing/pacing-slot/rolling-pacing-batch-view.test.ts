import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPacingBatchView, toRollingPacingBatchViews } from "./rolling-pacing-batch-view.js";
import { newRollingPacingBatch } from "./rolling-pacing-batch.js";

test("RollingPacingBatchView shows the status in capitals", () => {
  const item = newRollingPacingBatch("code-716", "name-67");
  const view = toRollingPacingBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPacingBatchViews([item, item]).length, 2, "views");
});
