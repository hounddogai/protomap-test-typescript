import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientSubscriptionPreferenceView,
  toLenientSubscriptionPreferenceViews,
} from "./lenient-subscription-preference-view.js";
import { newLenientSubscriptionPreference } from "./lenient-subscription-preference.js";

test("LenientSubscriptionPreferenceView shows the status in capitals", () => {
  const item = newLenientSubscriptionPreference("code-753", "title-169");
  const view = toLenientSubscriptionPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientSubscriptionPreferenceViews([item, item]).length, 2, "views");
});
