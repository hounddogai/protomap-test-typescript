import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualSubscriptionBaselineView,
  toManualSubscriptionBaselineViews,
} from "./manual-subscription-baseline-view.js";
import { newManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

test("ManualSubscriptionBaselineView shows the status in capitals", () => {
  const item = newManualSubscriptionBaseline("code-798", "name-699");
  const view = toManualSubscriptionBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualSubscriptionBaselineViews([item, item]).length, 2, "views");
});
