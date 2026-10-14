import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedJourneySummaryView, toBatchedJourneySummaryViews } from "./batched-journey-summary-view.js";
import { newBatchedJourneySummary } from "./batched-journey-summary.js";

test("BatchedJourneySummaryView shows the status in capitals", () => {
  const item = newBatchedJourneySummary("code-922", "title-7");
  const view = toBatchedJourneySummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedJourneySummaryViews([item, item]).length, 2, "views");
});
