import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCreativeSummaryView, toPendingCreativeSummaryViews } from "./pending-creative-summary-view.js";
import { newPendingCreativeSummary } from "./pending-creative-summary.js";

test("PendingCreativeSummaryView shows the status in capitals", () => {
  const item = newPendingCreativeSummary("code-40", "name-308");
  const view = toPendingCreativeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCreativeSummaryViews([item, item]).length, 2, "views");
});
