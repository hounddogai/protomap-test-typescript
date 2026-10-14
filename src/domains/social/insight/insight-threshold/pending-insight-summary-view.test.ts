import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingInsightSummaryView, toPendingInsightSummaryViews } from "./pending-insight-summary-view.js";
import { newPendingInsightSummary } from "./pending-insight-summary.js";

test("PendingInsightSummaryView shows the status in capitals", () => {
  const item = newPendingInsightSummary("code-156", "name-313");
  const view = toPendingInsightSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingInsightSummaryViews([item, item]).length, 2, "views");
});
