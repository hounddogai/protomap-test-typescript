import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedJourneyBatchView, toWeightedJourneyBatchViews } from "./weighted-journey-batch-view.js";
import { newWeightedJourneyBatch } from "./weighted-journey-batch.js";

test("WeightedJourneyBatchView shows the status in capitals", () => {
  const item = newWeightedJourneyBatch("code-274", "label-399");
  const view = toWeightedJourneyBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedJourneyBatchViews([item, item]).length, 2, "views");
});
