import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionRollupView, toSubscriptionRollupViews } from "./subscription-rollup-view.js";
import { newSubscriptionRollup } from "./subscription-rollup.js";

test("SubscriptionRollupView shows the status in capitals", () => {
  const item = newSubscriptionRollup("code-252", "name-940");
  const view = toSubscriptionRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionRollupViews([item, item]).length, 2, "views");
});
