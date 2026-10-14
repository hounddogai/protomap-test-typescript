import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalCreativeSummaryView, toGlobalCreativeSummaryViews } from "./global-creative-summary-view.js";
import { newGlobalCreativeSummary } from "./global-creative-summary.js";

test("GlobalCreativeSummaryView shows the status in capitals", () => {
  const item = newGlobalCreativeSummary("code-825", "label-187");
  const view = toGlobalCreativeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalCreativeSummaryViews([item, item]).length, 2, "views");
});
