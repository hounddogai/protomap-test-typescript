import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedNudgeBatchView, toCappedNudgeBatchViews } from "./capped-nudge-batch-view.js";
import { newCappedNudgeBatch } from "./capped-nudge-batch.js";

test("CappedNudgeBatchView shows the status in capitals", () => {
  const item = newCappedNudgeBatch("code-145", "label-687");
  const view = toCappedNudgeBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedNudgeBatchViews([item, item]).length, 2, "views");
});
