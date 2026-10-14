import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictFraudCheckSummaryView, toStrictFraudCheckSummaryViews } from "./strict-fraud-check-summary-view.js";
import { newStrictFraudCheckSummary } from "./strict-fraud-check-summary.js";

test("StrictFraudCheckSummaryView shows the status in capitals", () => {
  const item = newStrictFraudCheckSummary("code-352", "label-414");
  const view = toStrictFraudCheckSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFraudCheckSummaryViews([item, item]).length, 2, "views");
});
