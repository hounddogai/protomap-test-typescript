import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualCreativeSummaryView, toManualCreativeSummaryViews } from "./manual-creative-summary-view.js";
import { newManualCreativeSummary } from "./manual-creative-summary.js";

test("ManualCreativeSummaryView shows the status in capitals", () => {
  const item = newManualCreativeSummary("code-251", "title-707");
  const view = toManualCreativeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualCreativeSummaryViews([item, item]).length, 2, "views");
});
