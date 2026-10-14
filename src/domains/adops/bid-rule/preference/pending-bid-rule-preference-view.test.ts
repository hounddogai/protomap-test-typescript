import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingBidRulePreferenceView,
  toPendingBidRulePreferenceViews,
} from "./pending-bid-rule-preference-view.js";
import { newPendingBidRulePreference } from "./pending-bid-rule-preference.js";

test("PendingBidRulePreferenceView shows the status in capitals", () => {
  const item = newPendingBidRulePreference("code-583", "label-592");
  const view = toPendingBidRulePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingBidRulePreferenceViews([item, item]).length, 2, "views");
});
