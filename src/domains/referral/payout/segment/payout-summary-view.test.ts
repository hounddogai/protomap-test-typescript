import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutSummaryView, toPayoutSummaryViews } from "./payout-summary-view.js";
import { newPayoutSummary } from "./payout-summary.js";

test("PayoutSummaryView shows the status in capitals", () => {
  const item = newPayoutSummary("code-928", "name-888");
  const view = toPayoutSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutSummaryViews([item, item]).length, 2, "views");
});
