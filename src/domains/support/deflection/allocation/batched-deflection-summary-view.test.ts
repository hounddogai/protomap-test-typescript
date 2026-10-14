import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedDeflectionSummaryView,
  toBatchedDeflectionSummaryViews,
} from "./batched-deflection-summary-view.js";
import { newBatchedDeflectionSummary } from "./batched-deflection-summary.js";

test("BatchedDeflectionSummaryView shows the status in capitals", () => {
  const item = newBatchedDeflectionSummary("code-982", "title-698");
  const view = toBatchedDeflectionSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedDeflectionSummaryViews([item, item]).length, 2, "views");
});
