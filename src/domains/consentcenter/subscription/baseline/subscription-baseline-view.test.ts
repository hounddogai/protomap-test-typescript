import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionBaselineView, toSubscriptionBaselineViews } from "./subscription-baseline-view.js";
import { newSubscriptionBaseline } from "./subscription-baseline.js";

test("SubscriptionBaselineView shows the status in capitals", () => {
  const item = newSubscriptionBaseline("code-971", "label-358");
  const view = toSubscriptionBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionBaselineViews([item, item]).length, 2, "views");
});
