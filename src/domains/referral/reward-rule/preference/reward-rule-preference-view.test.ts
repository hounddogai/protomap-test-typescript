import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRulePreferenceView, toRewardRulePreferenceViews } from "./reward-rule-preference-view.js";
import { newRewardRulePreference } from "./reward-rule-preference.js";

test("RewardRulePreferenceView shows the status in capitals", () => {
  const item = newRewardRulePreference("code-841", "name-288");
  const view = toRewardRulePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRulePreferenceViews([item, item]).length, 2, "views");
});
