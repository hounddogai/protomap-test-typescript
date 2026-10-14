import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionBundleView, toSubscriptionBundleViews } from "./subscription-bundle-view.js";
import { newSubscriptionBundle } from "./subscription-bundle.js";

test("SubscriptionBundleView shows the status in capitals", () => {
  const item = newSubscriptionBundle("code-906", "label-465");
  const view = toSubscriptionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionBundleViews([item, item]).length, 2, "views");
});
