import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalFraudCheckSummaryView, toGlobalFraudCheckSummaryViews } from "./global-fraud-check-summary-view.js";
import { newGlobalFraudCheckSummary } from "./global-fraud-check-summary.js";

test("GlobalFraudCheckSummaryView shows the status in capitals", () => {
  const item = newGlobalFraudCheckSummary("code-200", "label-443");
  const view = toGlobalFraudCheckSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalFraudCheckSummaryViews([item, item]).length, 2, "views");
});
