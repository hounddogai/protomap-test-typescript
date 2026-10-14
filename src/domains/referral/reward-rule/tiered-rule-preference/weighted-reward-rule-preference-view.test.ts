import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedRewardRulePreferenceView,
  toWeightedRewardRulePreferenceViews,
} from "./weighted-reward-rule-preference-view.js";
import { newWeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

test("WeightedRewardRulePreferenceView shows the status in capitals", () => {
  const item = newWeightedRewardRulePreference("code-281", "title-374");
  const view = toWeightedRewardRulePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedRewardRulePreferenceViews([item, item]).length, 2, "views");
});
