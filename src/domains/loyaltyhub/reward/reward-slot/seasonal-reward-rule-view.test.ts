import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalRewardRuleView, toSeasonalRewardRuleViews } from "./seasonal-reward-rule-view.js";
import { newSeasonalRewardRule } from "./seasonal-reward-rule.js";

test("SeasonalRewardRuleView shows the status in capitals", () => {
  const item = newSeasonalRewardRule("code-4", "title-715");
  const view = toSeasonalRewardRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalRewardRuleViews([item, item]).length, 2, "views");
});
