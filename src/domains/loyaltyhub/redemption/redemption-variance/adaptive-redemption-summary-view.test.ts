import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveRedemptionSummaryView,
  toAdaptiveRedemptionSummaryViews,
} from "./adaptive-redemption-summary-view.js";
import { newAdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

test("AdaptiveRedemptionSummaryView shows the status in capitals", () => {
  const item = newAdaptiveRedemptionSummary("code-624", "title-237");
  const view = toAdaptiveRedemptionSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveRedemptionSummaryViews([item, item]).length, 2, "views");
});
