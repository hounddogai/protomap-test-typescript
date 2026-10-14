import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackSubscriptionOverrideView,
  toFallbackSubscriptionOverrideViews,
} from "./fallback-subscription-override-view.js";
import { newFallbackSubscriptionOverride } from "./fallback-subscription-override.js";

test("FallbackSubscriptionOverrideView shows the status in capitals", () => {
  const item = newFallbackSubscriptionOverride("code-752", "title-119");
  const view = toFallbackSubscriptionOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSubscriptionOverrideViews([item, item]).length, 2, "views");
});
