import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelSummaryView, toFunnelSummaryViews } from "./funnel-summary-view.js";
import { newFunnelSummary } from "./funnel-summary.js";

test("FunnelSummaryView shows the status in capitals", () => {
  const item = newFunnelSummary("code-633", "name-140");
  const view = toFunnelSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelSummaryViews([item, item]).length, 2, "views");
});
