import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackJourneySummaryView, toFallbackJourneySummaryViews } from "./fallback-journey-summary-view.js";
import { newFallbackJourneySummary } from "./fallback-journey-summary.js";

test("FallbackJourneySummaryView shows the status in capitals", () => {
  const item = newFallbackJourneySummary("code-80", "name-15");
  const view = toFallbackJourneySummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackJourneySummaryViews([item, item]).length, 2, "views");
});
