import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortBatchView, toCohortBatchViews } from "./cohort-batch-view.js";
import { newCohortBatch } from "./cohort-batch.js";

test("CohortBatchView shows the status in capitals", () => {
  const item = newCohortBatch("code-472", "name-693");
  const view = toCohortBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortBatchViews([item, item]).length, 2, "views");
});
