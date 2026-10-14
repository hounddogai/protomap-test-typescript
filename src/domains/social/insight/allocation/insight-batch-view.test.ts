import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightBatchView, toInsightBatchViews } from "./insight-batch-view.js";
import { newInsightBatch } from "./insight-batch.js";

test("InsightBatchView shows the status in capitals", () => {
  const item = newInsightBatch("code-185", "name-871");
  const view = toInsightBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightBatchViews([item, item]).length, 2, "views");
});
