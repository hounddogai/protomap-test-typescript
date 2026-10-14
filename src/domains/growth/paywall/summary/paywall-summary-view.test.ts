import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallSummaryView, toPaywallSummaryViews } from "./paywall-summary-view.js";
import { newPaywallSummary } from "./paywall-summary.js";

test("PaywallSummaryView shows the status in capitals", () => {
  const item = newPaywallSummary("code-954", "label-748");
  const view = toPaywallSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallSummaryViews([item, item]).length, 2, "views");
});
