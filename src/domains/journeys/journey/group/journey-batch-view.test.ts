import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyBatchView, toJourneyBatchViews } from "./journey-batch-view.js";
import { newJourneyBatch } from "./journey-batch.js";

test("JourneyBatchView shows the status in capitals", () => {
  const item = newJourneyBatch("code-545", "title-72");
  const view = toJourneyBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyBatchViews([item, item]).length, 2, "views");
});
