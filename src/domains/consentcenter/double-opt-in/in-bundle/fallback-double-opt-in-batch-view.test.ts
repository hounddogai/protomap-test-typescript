import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackDoubleOptInBatchView,
  toFallbackDoubleOptInBatchViews,
} from "./fallback-double-opt-in-batch-view.js";
import { newFallbackDoubleOptInBatch } from "./fallback-double-opt-in-batch.js";

test("FallbackDoubleOptInBatchView shows the status in capitals", () => {
  const item = newFallbackDoubleOptInBatch("code-723", "title-544");
  const view = toFallbackDoubleOptInBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackDoubleOptInBatchViews([item, item]).length, 2, "views");
});
