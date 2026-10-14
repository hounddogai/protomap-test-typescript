import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackBidRulePreferenceView,
  toFallbackBidRulePreferenceViews,
} from "./fallback-bid-rule-preference-view.js";
import { newFallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

test("FallbackBidRulePreferenceView shows the status in capitals", () => {
  const item = newFallbackBidRulePreference("code-93", "name-687");
  const view = toFallbackBidRulePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackBidRulePreferenceViews([item, item]).length, 2, "views");
});
