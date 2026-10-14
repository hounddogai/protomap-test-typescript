import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyBatchView, toFrequencyBatchViews } from "./frequency-batch-view.js";
import { newFrequencyBatch } from "./frequency-batch.js";

test("FrequencyBatchView shows the status in capitals", () => {
  const item = newFrequencyBatch("code-385", "label-91");
  const view = toFrequencyBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyBatchViews([item, item]).length, 2, "views");
});
