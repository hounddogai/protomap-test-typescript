import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingSubscriptionSummaryView,
  toRollingSubscriptionSummaryViews,
} from "./rolling-subscription-summary-view.js";
import { newRollingSubscriptionSummary } from "./rolling-subscription-summary.js";

test("RollingSubscriptionSummaryView shows the status in capitals", () => {
  const item = newRollingSubscriptionSummary("code-994", "name-393");
  const view = toRollingSubscriptionSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingSubscriptionSummaryViews([item, item]).length, 2, "views");
});
