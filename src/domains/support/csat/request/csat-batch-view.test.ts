import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatBatchView, toCsatBatchViews } from "./csat-batch-view.js";
import { newCsatBatch } from "./csat-batch.js";

test("CsatBatchView shows the status in capitals", () => {
  const item = newCsatBatch("code-119", "name-778");
  const view = toCsatBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatBatchViews([item, item]).length, 2, "views");
});
