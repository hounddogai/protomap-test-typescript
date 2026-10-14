import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedPlacementBatchView, toWeightedPlacementBatchViews } from "./weighted-placement-batch-view.js";
import { newWeightedPlacementBatch } from "./weighted-placement-batch.js";

test("WeightedPlacementBatchView shows the status in capitals", () => {
  const item = newWeightedPlacementBatch("code-832", "title-160");
  const view = toWeightedPlacementBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPlacementBatchViews([item, item]).length, 2, "views");
});
