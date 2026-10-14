import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallPreferenceView, toPaywallPreferenceViews } from "./paywall-preference-view.js";
import { newPaywallPreference } from "./paywall-preference.js";

test("PaywallPreferenceView shows the status in capitals", () => {
  const item = newPaywallPreference("code-610", "title-898");
  const view = toPaywallPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallPreferenceViews([item, item]).length, 2, "views");
});
