import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacySubscriptionBundleView,
  toLegacySubscriptionBundleViews,
} from "./legacy-subscription-bundle-view.js";
import { newLegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

test("LegacySubscriptionBundleView shows the status in capitals", () => {
  const item = newLegacySubscriptionBundle("code-456", "title-496");
  const view = toLegacySubscriptionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySubscriptionBundleViews([item, item]).length, 2, "views");
});
