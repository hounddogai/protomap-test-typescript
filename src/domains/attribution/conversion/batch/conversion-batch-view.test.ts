import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionBatchView, toConversionBatchViews } from "./conversion-batch-view.js";
import { newConversionBatch } from "./conversion-batch.js";

test("ConversionBatchView shows the status in capitals", () => {
  const item = newConversionBatch("code-222", "label-203");
  const view = toConversionBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionBatchViews([item, item]).length, 2, "views");
});
