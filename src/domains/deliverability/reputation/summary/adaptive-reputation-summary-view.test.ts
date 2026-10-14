import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveReputationSummaryView,
  toAdaptiveReputationSummaryViews,
} from "./adaptive-reputation-summary-view.js";
import { newAdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

test("AdaptiveReputationSummaryView shows the status in capitals", () => {
  const item = newAdaptiveReputationSummary("code-118", "title-504");
  const view = toAdaptiveReputationSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveReputationSummaryViews([item, item]).length, 2, "views");
});
