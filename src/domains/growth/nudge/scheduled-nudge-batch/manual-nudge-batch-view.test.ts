import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualNudgeBatchView, toManualNudgeBatchViews } from "./manual-nudge-batch-view.js";
import { newManualNudgeBatch } from "./manual-nudge-batch.js";

test("ManualNudgeBatchView shows the status in capitals", () => {
  const item = newManualNudgeBatch("code-240", "label-980");
  const view = toManualNudgeBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualNudgeBatchViews([item, item]).length, 2, "views");
});
