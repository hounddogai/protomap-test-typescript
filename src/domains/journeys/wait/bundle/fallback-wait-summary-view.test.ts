import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackWaitSummaryView, toFallbackWaitSummaryViews } from "./fallback-wait-summary-view.js";
import { newFallbackWaitSummary } from "./fallback-wait-summary.js";

test("FallbackWaitSummaryView shows the status in capitals", () => {
  const item = newFallbackWaitSummary("code-369", "title-286");
  const view = toFallbackWaitSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackWaitSummaryViews([item, item]).length, 2, "views");
});
