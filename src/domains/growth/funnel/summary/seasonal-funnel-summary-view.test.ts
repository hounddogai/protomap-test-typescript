import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalFunnelSummaryView, toSeasonalFunnelSummaryViews } from "./seasonal-funnel-summary-view.js";
import { newSeasonalFunnelSummary } from "./seasonal-funnel-summary.js";

test("SeasonalFunnelSummaryView shows the status in capitals", () => {
  const item = newSeasonalFunnelSummary("code-520", "label-566");
  const view = toSeasonalFunnelSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalFunnelSummaryViews([item, item]).length, 2, "views");
});
