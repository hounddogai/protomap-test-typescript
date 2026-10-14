import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictRewardRulePreferenceView,
  toStrictRewardRulePreferenceViews,
} from "./strict-reward-rule-preference-view.js";
import { newStrictRewardRulePreference } from "./strict-reward-rule-preference.js";

test("StrictRewardRulePreferenceView shows the status in capitals", () => {
  const item = newStrictRewardRulePreference("code-235", "label-919");
  const view = toStrictRewardRulePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictRewardRulePreferenceViews([item, item]).length, 2, "views");
});
