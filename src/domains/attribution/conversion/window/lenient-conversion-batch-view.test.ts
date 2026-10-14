import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientConversionBatchView, toLenientConversionBatchViews } from "./lenient-conversion-batch-view.js";
import { newLenientConversionBatch } from "./lenient-conversion-batch.js";

test("LenientConversionBatchView shows the status in capitals", () => {
  const item = newLenientConversionBatch("code-511", "title-118");
  const view = toLenientConversionBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientConversionBatchViews([item, item]).length, 2, "views");
});
