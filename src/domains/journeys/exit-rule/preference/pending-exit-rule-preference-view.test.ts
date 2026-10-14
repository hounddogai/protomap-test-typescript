import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingExitRulePreferenceView,
  toPendingExitRulePreferenceViews,
} from "./pending-exit-rule-preference-view.js";
import { newPendingExitRulePreference } from "./pending-exit-rule-preference.js";

test("PendingExitRulePreferenceView shows the status in capitals", () => {
  const item = newPendingExitRulePreference("code-688", "name-516");
  const view = toPendingExitRulePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingExitRulePreferenceViews([item, item]).length, 2, "views");
});
