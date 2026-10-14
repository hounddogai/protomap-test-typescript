import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedQueueMappingView, toWeightedQueueMappingViews } from "./weighted-queue-mapping-view.js";
import { newWeightedQueueMapping } from "./weighted-queue-mapping.js";

test("WeightedQueueMappingView shows the status in capitals", () => {
  const item = newWeightedQueueMapping("code-475", "label-718");
  const view = toWeightedQueueMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedQueueMappingViews([item, item]).length, 2, "views");
});
